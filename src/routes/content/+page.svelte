<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData, { peekCache } from '$utils/fetchClientData';
	import { CONTENT_CACHE_TTL, DIGEST_PAGE_SLUG, contentEntriesQuery, contentIndexQuery, contentIndexCacheKey, contentDigestCacheKey } from '$utils/content';
	import { getReadAnchors } from '$utils/readProgress';
	import { splitTrackableChunks } from '$utils/markdown';
	import ContentEntryCard, { type EntryStatus } from '$components/parts/content/ContentEntryCard.svelte';
	import type { ContentEntry, ContentGroup } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';

	let entries = $state<ContentEntry[]>([]);
	let loading = $state(true);
	let statuses = $state<Record<string, EntryStatus>>({});

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
				entries = res.contentEntries ?? [];
				loading = false;

				for (const entry of entries) {
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

<svelte:head>
	<title>{getPageTitle(`Content`)}</title>
</svelte:head>

<h1>Content</h1>
{#if loading}
	<p>Loading...</p>
{:else if entries.length === 0}
	<p>No content yet.</p>
{:else}
	<ul class="list">
		{#each entries as entry (entry.slug)}
			{@const slug = entry.slug ?? ``}
			<ContentEntryCard {entry} status={statuses[slug]} />
		{/each}
	</ul>
{/if}

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
