import { writable } from 'svelte/store';
import { getToken } from '$lib/auth';

// Single source of truth for the default cache lifetime - override for the whole
// app via VITE_CACHE_TTL_MINUTES in .env, or per-call via the `ttl` prop.
const DEFAULT_CACHE_TTL = Number(import.meta.env.VITE_CACHE_TTL_MINUTES ?? 30) * 60 * 1000;

const LAST_DATA_UPDATE_KEY = `lastDataUpdate`;

function getStoredLastDataUpdate(): number | null {
	if (typeof localStorage === `undefined`) return null;
	try {
		const raw = localStorage.getItem(LAST_DATA_UPDATE_KEY);
		return raw ? Number(raw) : null;
	}
	catch {
		return null;
	}
}

// Timestamp of the most recent successful fetch that populated the cache -
// surfaced in the online/offline status popup so a stale-offline session
// shows when its data actually last refreshed.
export const lastDataUpdate = writable<number | null>(getStoredLastDataUpdate());

type FetchClientDataProps = {
	gqlQuery: string
	cacheKey?: string
	skipCache?: boolean
	/** Overrides DEFAULT_CACHE_TTL (ms) for this call only. */
	ttl?: number
	/** Called immediately with cached data if available; the promise still resolves with fresh data. */
	onStale?: (data: any) => void
}

function getCached(key: string, ttl: number): any | null {
	try {
		const cached = localStorage.getItem(`cache:${key}`);
		if (!cached) return null;
		const { data, timestamp } = JSON.parse(cached);
		if (Date.now() - timestamp > ttl) return null;
		return data;
	}
	catch {
		return null;
	}
}

// Read-only cache lookup, for callers that want cached data if it happens to
// already be there (e.g. computing read-progress status on an index page from
// whatever detail pages the user has already visited) without triggering a
// network fetch for entries that aren't cached yet.
export function peekCache(key: string, ttl: number = DEFAULT_CACHE_TTL): any | null {
	return getCached(key, ttl);
}

// Falls back to whatever's cached regardless of ttl, so an upstream failure resolves with
// stale data (a caller may already be showing via onStale) rather than blanking a card out.
function getStaleFallback(cacheKey: string | undefined): any | null {
	if (!cacheKey) return null;
	return getCached(cacheKey, Infinity);
}

export function setCache(key: string, data: any) {
	try {
		const timestamp = Date.now();
		localStorage.setItem(`cache:${key}`, JSON.stringify({ data, timestamp }));
		localStorage.setItem(LAST_DATA_UPDATE_KEY, String(timestamp));
		lastDataUpdate.set(timestamp);
	}
	catch {}
}

// For mutations made outside the page that owns a cacheKey (e.g. a quick-add
// command palette) - drop the stale cache entirely so that page's next visit
// fetches fresh data instead of serving a 30-minute-old snapshot missing it.
export function clearCache(key: string) {
	try {
		localStorage.removeItem(`cache:${key}`);
	}
	catch {}
}

// Backs the global refresh button in the status popup - drops every page's
// cache entry so the next reload hits the network instead of serving
// whatever's still within its TTL.
export function clearAllCache() {
	try {
		Object.keys(localStorage)
			.filter((key) => key.startsWith(`cache:`))
			.forEach((key) => localStorage.removeItem(key));
	}
	catch {}
}

// adapter-static means /api/* server routes don't exist at runtime in production -
// mutation call sites doing their own fetch() must resolve the same way, or they
// silently 405 against the deployed static host instead of reaching the API.
export function getGraphqlUrl(): string {
	return import.meta.env.VITE_API_URL
		? `${import.meta.env.VITE_API_URL}/graphql`
		: `/api/graphql`;
}

const fetchClientData = async (props: FetchClientDataProps) => {
	const { gqlQuery, cacheKey, skipCache, ttl = DEFAULT_CACHE_TTL, onStale } = props;

	if (cacheKey && !skipCache) {
		const cached = getCached(cacheKey, ttl);
		if (cached) {
			if (onStale) {
				// Stale-while-revalidate: show cached immediately, fetch fresh below
				onStale(cached);
			}
			else {
				return cached;
			}
		}
	}

	const token = await getToken();

	const headers: Record<string, string> = {
		'Content-Type': `application/json`,
	};

	if (token) {
		headers[`Authorization`] = `Bearer ${token}`;
	}

	try {
		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers,
			body: JSON.stringify({ query: gqlQuery }),
		}).then((r) => r.json());

		if (res?.errors) {
			console.log({ ...res });
			// The proxy itself responds 200 with an `errors` array on an upstream timeout/abort
			// (see api/graphql/+server.ts) rather than throwing, so this needs its own stale
			// fallback rather than relying on the catch block below.
			const stale = getStaleFallback(cacheKey);
			if (stale) return stale;
			return {};
		}

		const result = res?.data || {};

		if (cacheKey && Object.keys(result).length > 0) {
			setCache(cacheKey, result);
		}

		return result;
	}
	catch (err) {
		console.error(err);
		// The request itself failed (offline, DNS, timeout, etc.) rather than the
		// API responding with an error.
		const stale = getStaleFallback(cacheKey);
		if (stale) return stale;
		return {};
	}
};

export default fetchClientData;
