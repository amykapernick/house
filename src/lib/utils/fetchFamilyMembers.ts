import fetchClientData from './fetchClientData';

export const EVERYONE = `everyone`;

export type FamilyMember = { slug: string; name: string; colour: string | null };

// Shared by the schedule, tasks, and calendar pages so all three filter
// consistently: EVERYONE always passes, otherwise at least one linked family
// member (task/habit assignee, or ics calendar owner) must match the selection.
export function isVisibleToUser(members: { slug: string }[] | null | undefined, selectedUserSlug: string): boolean {
	if (selectedUserSlug === EVERYONE) return true;
	return (members ?? []).some((member) => member.slug === selectedUserSlug);
}

export default async function fetchFamilyMembers(onStale?: (members: FamilyMember[]) => void): Promise<FamilyMember[]> {
	const res = await fetchClientData({
		cacheKey: `family`,
		onStale: (data) => onStale?.(data.users ?? []),
		gqlQuery: `
			query {
				users {
					slug
					name
					colour
				}
			}
		`,
	});

	return res.users ?? [];
}

// Separate cache key from the header/profile `me` queries (different shapes) -
// resolves the signed-in user's own family slug, used by FamilyFilter to
// default the filter to "just me" instead of "everyone".
export async function fetchCurrentUserSlug(onStale?: (slug: string | undefined) => void): Promise<string | undefined> {
	const res = await fetchClientData({
		cacheKey: `family-filter-me`,
		onStale: (data) => onStale?.(data.me?.slug),
		gqlQuery: `
			query {
				me { slug }
			}
		`,
	});

	return res.me?.slug;
}
