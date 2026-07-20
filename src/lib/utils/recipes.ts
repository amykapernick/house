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
