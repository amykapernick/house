import { format, parseISO } from 'date-fns';
import type { Gifts, GiftPerson, GiftOccasion, GiftMutationResult } from '$types/generated';
import { DATE_FORMATS } from '$utils/dateFormats';
import { getToken } from '$lib/auth';
import fetchClientData, { clearCachePrefix, getGraphqlUrl } from '$utils/fetchClientData';

// Gift planning for the household - see household_api's gifts domain. The API does all the
// joining, filtering and totals (and strips gifts for the signed-in person), so this file only
// holds the queries and the mutation call.

const CACHE_PREFIX = `gifts`;

export const OCCASION_TYPES = [
	{ value: `birthday`, label: `Birthday` },
	{ value: `christmas`, label: `Christmas` },
	{ value: `anniversary`, label: `Anniversary` },
	{ value: `other`, label: `Other` },
] as const;

export const MONTHS = [`January`, `February`, `March`, `April`, `May`, `June`, `July`, `August`, `September`, `October`, `November`, `December`] as const;

export const PURCHASE_STATUSES = [
	{ value: `claimed`, label: `Claimed` },
	{ value: `bought`, label: `Bought` },
	{ value: `wrapped`, label: `Wrapped` },
] as const;

// Gift tags (at most one per idea or purchase) - see GIFT_TAGS in household_api's gifts domain.
// The first seven are the kids' theme, tracked per occasion; Santa is counted on its own.
export const THEME_TAGS = [
	{ value: `want`, label: `Want`, long: `Something they want` },
	{ value: `need`, label: `Need`, long: `Something they need` },
	{ value: `do`, label: `Do`, long: `Something to do` },
	{ value: `read`, label: `Read`, long: `Something to read` },
	{ value: `wear`, label: `Wear`, long: `Something to wear` },
	{ value: `share`, label: `Share`, long: `Something to share` },
	{ value: `from_us`, label: `From us`, long: `Something from us` },
] as const;

export const GIFT_TAGS = [...THEME_TAGS, { value: `santa`, label: `Santa`, long: `From Santa` }] as const;

export const tagLabel = (tag: string) => GIFT_TAGS.find((entry) => entry.value === tag)?.label ?? tag;

const MEMBER = `slug name hasLogin isViewer wishlistPersonId wishlistPersonName`;
const PURCHASE = `id personId personName title url notes price occasionId occasionName year status boughtBy wishlistItemId wishlistClaimId ideaId tag`;
const HISTORY = `id personId personName title url date giver byUs source price status occasionName needsDetails canEdit wishlistItemId wishlistClaimId purchase { ${PURCHASE} } quickOccasions { id year label }`;

const OCCASION = `id name type date personIds next year daysUntil spent people { personId name spent themed themes { tag count } santa purchases { ${PURCHASE} } }`;

const OVERVIEW_QUERY = `
	query {
		gifts {
			linked
			wishlistAvailable
			viewer { ${MEMBER} }
			household { ${MEMBER} }
			linkOptions { id name }
			people {
				id name isUs
				occasions { id name year }
				nextOccasion { id year }
			}
			occasions { ${OCCASION} }
			needsDetails { ${HISTORY} }
		}
	}
`;

type FetchOptions<T> = { onStale?: (data: T) => void; skipCache?: boolean };

function query<T>(cacheKey: string, gqlQuery: string, pick: (gifts: any) => T, options: FetchOptions<T>): Promise<T> {
	return fetchClientData({
		cacheKey,
		gqlQuery,
		skipCache: options.skipCache,
		onStale: options.onStale ? (data) => options.onStale?.(pick(data?.gifts)) : undefined,
	}).then((data) => pick(data?.gifts));
}

/** Who's who, people for the pickers, occasions with their totals, and claims needing details. */
export function fetchGiftsOverview(options: FetchOptions<Gifts | null> = {}) {
	return query(CACHE_PREFIX, OVERVIEW_QUERY, (gifts) => gifts ?? null, options);
}

/** One person's wishlist, ideas, sizes, occasions and past gifts. */
export function fetchGiftPerson(id: string, options: FetchOptions<GiftPerson | null> = {}) {
	return query(
		`${CACHE_PREFIX}-person-${id}`,
		`query {
			gifts {
				person(id: ${JSON.stringify(id)}) {
					id name
					sizes { item size updatedAt }
					wishlist { id personId title url notes evergreen claimed claimedBy claimedByUs claimedAt suggestedBy canClaim }
					ideas { id personId title url notes price occasionId status wishlistItemId canSuggest tag }
					history { ${HISTORY} }
					occasions { id name type next }
				}
			}
		}`,
		(gifts) => gifts?.person ?? null,
		options
	);
}

/** Occasions older than a week, most recent first, with what was logged against them. */
export function fetchPastOccasions(options: FetchOptions<GiftOccasion[]> = {}) {
	return query(`${CACHE_PREFIX}-past`, `query { gifts { pastOccasions { ${OCCASION} } } }`, (gifts) => gifts?.pastOccasions ?? [], options);
}

/**
 * Runs one gifts mutation with variables (everything here is free text the user typed, so it
 * never goes into the query string itself) and drops every cached gifts query on success.
 */
export async function giftMutation(name: string, signature: string, args: string, variables: Record<string, unknown>): Promise<GiftMutationResult> {
	const token = await getToken();

	try {
		const json = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation(${signature}) { ${name}(${args}) { success id message } }`,
				variables,
			}),
		}).then((r) => r.json());

		const result = json?.data?.[name] as GiftMutationResult | undefined;
		if (json?.errors || !result) {
			console.error(`[gifts] ${name} failed:`, json?.errors ?? json);
			const reason = json?.errors?.[0]?.message;
			return { success: false, id: null, message: reason ? `Couldn't save: ${reason}` : `Couldn't save. Try again.` };
		}
		if (result.success) clearCachePrefix(CACHE_PREFIX);
		return result;
	}
	catch (err) {
		console.error(`[gifts] ${name} failed:`, err);
		return { success: false, id: null, message: `Couldn't reach the server. Try again.` };
	}
}

/** Birthdays are only a month ("October" - the year is in the occasion's name); others a full date. */
export function formatOccasionDate(occasion: { type: string; next: string }): string {
	return format(parseISO(occasion.next), occasion.type === `birthday` ? DATE_FORMATS.monthName : DATE_FORMATS.full);
}

export function describeDaysUntil(days: number): string {
	if (days === 0) return `Today`;
	if (days === 1) return `Tomorrow`;
	if (days > 1) return `In ${days} days`;
	if (days === -1) return `Yesterday`;
	return `${Math.abs(days)} days ago`;
}

/** "Christmas 2026" -> "Christmas", for upcoming occasions where the year goes without saying. */
export const withoutYear = (name: string) => name.replace(/\s+\d{4}$/, ``);
