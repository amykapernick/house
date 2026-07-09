// This content never changes once fetched - shared long cache TTL for the
// possums index (used by the /content/possums page and the CommandPalette's
// quick-lookup search) and each course page.
export const POSSUMS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

export const possumsIndexQuery = `
	query {
		possumsIndex {
			title
			description
			courses { slug title }
		}
	}
`;
