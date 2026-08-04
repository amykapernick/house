// fetchClientData only takes a raw query string (no variables support), so
// args are inlined here - JSON.stringify safely quotes/escapes them as
// GraphQL string literals, same technique as recipes.ts's importRecipeMutation.
export function addBookMutation(input: {
	isbn: string
	name?: string
	author?: string[]
	series?: string
	seriesNumber?: number
	thumbnail?: string
}): string {
	const fields = Object.entries(input)
		.filter(([, value]) => value !== undefined && value !== `` && !(Array.isArray(value) && value.length === 0))
		.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
		.join(`, `);

	return `
		mutation {
			addBook(input: { ${fields} }) {
				id
				name
				author
				series
				seriesNumber
				format
				thumbnail
			}
		}
	`;
}
