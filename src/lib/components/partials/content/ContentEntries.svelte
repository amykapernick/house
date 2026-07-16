<script lang="ts">
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData, { peekCache } from '$utils/fetchClientData';
	import { CONTENT_CACHE_TTL, DIGEST_PAGE_SLUG, contentEntriesQuery, contentIndexQuery, contentIndexCacheKey, contentDigestCacheKey } from '$utils/content';
	import { getReadAnchors } from '$utils/readProgress';
	import { splitTrackableChunks } from '$utils/markdown';
	import ContentEntryGrid from './ContentEntryGrid.svelte';
	import ContentEntryCard, { type EntryStatus } from '$components/parts/content/ContentEntryCard.svelte';
	import type { ContentEntry, ContentGroup } from '$types/generated';

	// The whole point of this component: /content and /content/archive are the
	// same entry list, just filtered/labelled/linked differently depending on
	// whether we're showing an entry's live content or its archived versions.
	let { archived = false }: { archived?: boolean } = $props();

	let allEntries = $state<ContentEntry[]>([]);
	let loading = $state(true);
	let statuses = $state<Record<string, EntryStatus>>({});

	// Only digest-style entries (Brief set) ever have archived versions -
	// course-style entries have no Archived checkbox concept at all (see
	// findEntry.ts).
	let entries = $derived(archived ? allEntries.filter((entry) => entry.brief && (entry.archivedCount ?? 0) > 0) : allEntries);
	let hasArchive = $derived(!archived && allEntries.some((entry) => (entry.archivedCount ?? 0) > 0));

	// Digest-style entries never get their full content bulk-fetched just to
	// populate this index (that's the same ~MB-per-entry cost the [pageSlug]
	// page deliberately avoids prefetching) - so this only reads whatever
	// contentDigest response the detail page has already cached, and derives
	// an exact read/total from the same splitTrackableChunks logic that page
	// uses. entry.sectionCount (a cheap version-row count from the API) is the
	// fallback total when there's nothing cached yet to compute the real one.
	function statusFromDigestCache(slug: string, fallbackTotal: number | null): EntryStatus {
		const cached = peekCache(contentDigestCacheKey(slug), CONTENT_CACHE_TTL);
		const content = cached?.contentDigest?.content;
		if (!content) return { total: fallbackTotal, read: 0 };

		const chunks = splitTrackableChunks(content).filter((chunk) => chunk.trackable);
		const readAnchors = getReadAnchors(slug, DIGEST_PAGE_SLUG);
		const read = chunks.filter((chunk) => chunk.anchor && readAnchors.has(chunk.anchor)).length;

		return { total: chunks.length, read };
	}

	// Course-style entries' section counts come from contentIndex, same as the
	// per-page counts already shown on /content/[slug] - lightweight (just
	// counts, no page text), so safe to fetch for every course entry up front.
	async function loadCourseStatus(slug: string): Promise<EntryStatus> {
		const res: any = await fetchClientData({
			cacheKey: contentIndexCacheKey(slug),
			ttl: CONTENT_CACHE_TTL,
			gqlQuery: contentIndexQuery(slug),
		});

		const groups: ContentGroup[] = res?.contentIndex ?? [];
		let total = 0;
		let read = 0;

		for (const group of groups) {
			for (const contentPage of group.pages ?? []) {
				if (!contentPage?.slug || !contentPage.sectionCount) continue;
				total += contentPage.sectionCount;
				read += Math.min(getReadAnchors(slug, contentPage.slug).size, contentPage.sectionCount);
			}
		}

		return { total, read };
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({
				cacheKey: `content-entries`,
				gqlQuery: contentEntriesQuery,
			}).then((res: any) => {
				allEntries = res.contentEntries ?? [];
				loading = false;

				// Read-progress statuses are only shown on the live /content list -
				// archived versions have no "read" concept, just a count.
				if (archived) return;

				for (const entry of allEntries) {
					const slug = entry?.slug ?? ``;
					if (!slug) continue;

					if (entry.brief) {
						statuses[slug] = statusFromDigestCache(slug, entry.sectionCount ?? null);
					}
					else {
						loadCourseStatus(slug).then((status) => {
							statuses[slug] = status;
						});
					}
				}
			});
		}
	});
</script>

{#if archived}
	<a href={resolve(`/content`)} class="nav-link">← Content</a>
{:else if hasArchive}
	<a href={resolve(`/content/archive`)} class="nav-link">View archive</a>
{/if}

<ContentEntryGrid {entries} {loading} emptyMessage={archived ? `No archived content yet.` : `No content yet.`}>
	{#snippet children(entry)}
		<ContentEntryCard {entry} {archived} status={statuses[entry.slug ?? ``]} />
	{/snippet}
</ContentEntryGrid>

<style>
	.nav-link {
		display: inline-block;
		margin-bottom: 10px;
		color: var(--purple_bright);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
