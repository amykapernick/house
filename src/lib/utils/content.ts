// The actual course/page content never changes once written, so it gets a
// long cache TTL. Entry metadata (title, icon) is deliberately NOT covered by
// this - Notion's uploaded-file icon URLs are pre-signed and expire after
// about an hour, so `contentEntries` is fetched with the default (short)
// cache TTL instead, to keep icons from going stale for weeks at a time.
export const CONTENT_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

export const contentEntriesQuery = `
	query {
		contentEntries {
			slug title icon iconType
		}
	}
`;

export function contentIndexQuery(slug: string): string {
	return `
		query {
			contentIndex(slug: "${slug}") {
				title
				description
				pages { slug title }
			}
		}
	`;
}

export function contentPageQuery(slug: string, pageSlug: string): string {
	return `
		query {
			contentPage(slug: "${slug}", pageSlug: "${pageSlug}") {
				slug title content
			}
		}
	`;
}
