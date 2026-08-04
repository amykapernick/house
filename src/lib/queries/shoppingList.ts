// Shared with src/routes/shopping-list/cart/+page.svelte, which reads/writes the same
// `shopping-list` localStorage cache key - the two pages must request the exact same
// shape, or whichever page populates the cache first silently drops fields the other
// page relies on for up to the cache's full TTL.
export const SHOPPING_LIST_QUERY = `
	query {
		shoppingList {
			items {
				id display checked quantity note
				category labels source link
				recipes { id name slug }
			}
			storeGroups {
				name
				items { id display checked quantity note category labels source link recipes { id name slug } }
				subGroups {
					name
					items { id display checked quantity note category labels source link recipes { id name slug } }
				}
			}
		}
		freezerItems {
			id name serves type upcoming
			recipes { name slug }
		}
	}
`;
