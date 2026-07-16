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

// Same as DIGEST_PAGE_SLUG, but for /content/archive/[slug] - a distinct
// sentinel so archived-version read progress doesn't collide with the live
// digest's anchors (they share the same anchor-generation logic but are
// different content).
export const ARCHIVE_PAGE_SLUG = `_archive`;

// Same idea again, for a flat saved-article entry (see findEntry.ts's
// `article` field) - also rendered directly under /content/[slug].
export const ARTICLE_PAGE_SLUG = `_article`;

export function contentIndexCacheKey(slug: string): string {
	return `content-index-${slug}`;
}

export function contentDigestCacheKey(slug: string): string {
	return `content-digest-${slug}`;
}

export function contentArchiveCacheKey(slug: string): string {
	return `content-archive-${slug}`;
}

export function contentArticleCacheKey(slug: string): string {
	return `content-article-${slug}`;
}

export const contentEntriesQuery = `
	query {
		contentEntries {
			slug title icon iconType brief sectionCount archivedCount updatedAt summary
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

export function contentArchiveQuery(slug: string): string {
	return `
		query {
			contentArchive(slug: "${slug}") {
				slug title content
			}
		}
	`;
}

export function contentArticleQuery(slug: string): string {
	return `
		query {
			contentArticle(slug: "${slug}") {
				slug title content
			}
		}
	`;
}

// fetchClientData only takes a raw query string (no variables support), so
// args are inlined here - JSON.stringify safely quotes/escapes them as
// GraphQL string literals, same technique as meal-plan's local gqlStr.
export function saveArticleMutation(url: string, title: string, excerpt?: string): string {
	const args = [`url: ${JSON.stringify(url)}`, `title: ${JSON.stringify(title)}`];
	if (excerpt) args.push(`excerpt: ${JSON.stringify(excerpt)}`);

	return `
		mutation {
			saveArticle(${args.join(`, `)})
		}
	`;
}
