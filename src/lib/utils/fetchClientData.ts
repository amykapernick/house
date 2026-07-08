import { getToken } from '$lib/auth';

// Single source of truth for the default cache lifetime - override for the whole
// app via VITE_CACHE_TTL_MINUTES in .env, or per-call via the `ttl` prop.
const DEFAULT_CACHE_TTL = Number(import.meta.env.VITE_CACHE_TTL_MINUTES ?? 30) * 60 * 1000;

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

export function setCache(key: string, data: any) {
	try {
		localStorage.setItem(`cache:${key}`, JSON.stringify({ data, timestamp: Date.now() }));
	}
	catch {}
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

	const apiUrl = import.meta.env.VITE_API_URL
		? `${import.meta.env.VITE_API_URL}/graphql`
		: `/api/graphql`;

	try {
		const res = await fetch(apiUrl, {
			method: `POST`,
			headers,
			body: JSON.stringify({ query: gqlQuery }),
		}).then((r) => r.json());

		if (res?.errors) {
			console.log({ ...res });
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
		// API responding with an error - fall back to whatever's cached regardless
		// of ttl, rather than resolving with {} and blanking out data a caller may
		// already be showing via onStale.
		if (cacheKey) {
			const stale = getCached(cacheKey, Infinity);
			if (stale) return stale;
		}
		return {};
	}
};

export default fetchClientData;
