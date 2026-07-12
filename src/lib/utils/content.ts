// The actual course/page content never changes once written, so it gets a
// long cache TTL. Entry metadata (title, icon) is deliberately NOT covered by
// this - Notion's uploaded-file icon URLs are pre-signed and expire after
// about an hour, so `contentEntries` is fetched with the default (short)
// cache TTL instead, to keep icons from going stale for weeks at a time.
export const CONTENT_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

// Digest-style entries (see contentEntriesQuery's `brief`) render their one
// page directly under /content/[slug] rather than a distinct [pageSlug]
// subpage, but readProgress's storage key still needs a non-empty second
// segment - this sentinel stands in for pageSlug there.
export const DIGEST_PAGE_SLUG = `_digest`;

export function contentIndexCacheKey(slug: string): string {
	return `content-index-${slug}`;
}

export function contentDigestCacheKey(slug: string): string {
	return `content-digest-${slug}`;
}

export const contentEntriesQuery = `
	query {
		contentEntries {
			slug title icon iconType brief sectionCount updatedAt
		}
	}
`;

export function contentIndexQuery(slug: string): string {
	return `
		query {
			contentIndex(slug: "${slug}") {
				title
				description
				pages { slug title sectionCount }
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

export function contentDigestQuery(slug: string): string {
	return `
		query {
			contentDigest(slug: "${slug}") {
				slug title content
			}
		}
	`;
}
