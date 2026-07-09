import fetchClientData from './fetchClientData';

// Full recipe content changes rarely once a recipe's imported, so once fetched
// (whether by prefetch or by visiting the recipe page) it stays valid for a week -
// long enough to browse the meal plan and open recipes while offline.
export const RECIPE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export function recipeQuery(slug: string): string {
	return `
		query {
			recipe(slug: "${slug}") {
				id name slug image description
				totalTime prepTime cookTime performTime
				servings recipeYield rating
				orgURL dateAdded lastMade
				tags { name slug }
				categories { name slug }
				ingredients {
					referenceId display quantity food note title
					unit { id name pluralName abbreviation pluralAbbreviation useAbbreviation fraction standardQuantity standardUnit }
				}
				instructions { id position title text }
				nutrition {
					calories carbohydrateContent fatContent
					proteinContent fiberContent sodiumContent sugarContent
				}
				notes { title text }
				tools
			}
			recipeUnits { id name pluralName abbreviation pluralAbbreviation useAbbreviation fraction standardQuantity standardUnit }
		}
	`;
}

/**
 * Fire-and-forget warm-up of full recipe content so recipe pages linked from the
 * dashboard/meal plan are available offline. Slugs already cached within
 * RECIPE_CACHE_TTL are skipped (fetchClientData resolves from cache with no
 * network call), so calling this repeatedly is cheap.
 */
export function prefetchRecipes(slugs: (string | null | undefined)[]) {
	const unique = [...new Set(slugs.filter((slug): slug is string => !!slug))];

	for (const slug of unique) {
		fetchClientData({
			cacheKey: `recipe-${slug}`,
			ttl: RECIPE_CACHE_TTL,
			gqlQuery: recipeQuery(slug),
		});
	}
}
