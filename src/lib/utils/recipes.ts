// fetchClientData only takes a raw query string (no variables support), so
// args are inlined here - JSON.stringify safely quotes/escapes them as
// GraphQL string literals, same technique as content.ts's saveArticleMutation.
export function importRecipeMutation(url: string): string {
	return `
		mutation {
			importRecipe(url: ${JSON.stringify(url)}) {
				slug
			}
		}
	`;
}

export function addRecipeToMealPlanMutation(recipeId: string, date: string, entryType: string): string {
	return `
		mutation {
			createMealPlanEntry(date: ${JSON.stringify(date)}, entryType: ${JSON.stringify(entryType)}, recipeId: ${JSON.stringify(recipeId)}) {
				id
			}
		}
	`;
}

export function addRecipeToShoppingListMutation(recipeId: string): string {
	return `
		mutation {
			addRecipesToShoppingList(recipeIds: [${JSON.stringify(recipeId)}]) {
				success
			}
		}
	`;
}

// Tags a household import script (see the sibling functions repo's
// import_from_media.py) attaches to auto-imported recipes as notes-to-self
// (source/completeness markers) rather than real browsable categories -
// hidden from the tag filter box and from the tags shown on recipe cards.
// Matched on a hyphen/underscore-insensitive form of the slug since Mealie's
// own slugification of the literal names that script writes isn't guaranteed
// to preserve the underscore.
const INTERNAL_TAG_NAMES = new Set([`from image`, `from video`, `no ingredients`, `no steps`, `needs name`]);

export function isInternalRecipeTag(tag: { slug: string }): boolean {
	return INTERNAL_TAG_NAMES.has(tag.slug.replaceAll(/[-_]/g, ` `).toLowerCase());
}

export function visibleRecipeTags<T extends { slug: string }>(tags: T[] | null | undefined): T[] {
	return (tags ?? []).filter((tag) => !isInternalRecipeTag(tag));
}
