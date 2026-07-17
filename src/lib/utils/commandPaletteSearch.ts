export type SearchSection =
	| `Pages`
	| `Recipes`
	| `Content`
	| `References`
	| `Suppliers`
	| `Assets`
	| `Small Human`
	| `Tasks`
	| `Shopping List`
	| `Budget`
	| `Schedule`;

// Sections beyond Pages/Recipes/Content only ever search behind the `/s`
// modifier (see parseDeepSearch below) - fetching+filtering budget, shopping
// list, etc. on every keystroke would flood a palette that's mostly used as
// a fast page/recipe jump tool. `/s /token query` scopes to one section.
export const SCOPE_TOKENS: Record<string, SearchSection> = {
	page: `Pages`, recipe: `Recipes`, content: `Content`,
	task: `Tasks`, shop: `Shopping List`, ref: `References`,
	supplier: `Suppliers`, asset: `Assets`,
	human: `Small Human`, budget: `Budget`, schedule: `Schedule`,
};

export type DeepSearchMatch = { scope: SearchSection | null; term: string };

// `/s query` or `/s /token query`. Only recognised when it's the very start of
// the query, so it never shadows the plain `/task`/`/shop` quick-add commands
// (those match position 0 directly - see CommandPalette's quickAddMatch).
// An unrecognised `/token` is treated as literal search text rather than a
// scope (e.g. `/s /unknown milk` searches everything for "/unknown milk").
export function parseDeepSearch(query: string): DeepSearchMatch | null {
	const match = /^\/s\b(.*)$/is.exec(query.trim());
	if (!match) return null;
	const rest = match[1].trim();
	const scopeMatch = /^\/(\w+)\b\s*(.*)$/is.exec(rest);
	const token = scopeMatch?.[1].toLowerCase();
	const scope = token ? SCOPE_TOKENS[token] : undefined;
	if (scope) return { scope, term: scopeMatch![2].trim().toLowerCase() };
	return { scope: null, term: rest.toLowerCase() };
}

// TODO: Add actual search page to allow viewing all results in more depth