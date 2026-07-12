<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData, { peekCache } from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { CONTENT_CACHE_TTL, DIGEST_PAGE_SLUG, contentEntriesQuery, contentIndexQuery, contentIndexCacheKey, contentDigestCacheKey } from '$utils/content';
	import { getReadAnchors } from '$utils/readProgress';
	import { splitTrackableChunks } from '$utils/markdown';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import type { ContentEntry, ContentGroup } from '$types/generated';

	// `total`/`read` are null until known - course-style entries need a
	// (cheap, structure-only) network call to find out, digest-style entries
	// only know their exact trackable-section read count if the page has
	// already been visited and cached locally (see statusFromDigestCache).
	type EntryStatus = { total: number | null, read: number | null };

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
		if (!content) return { total: fallbackTotal, read: null };

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
	<title>Content | Kapers Crewe Household</title>
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
			{@const status = statuses[slug]}
			<li>
				<a class="card" href={resolve(`/content/[slug]`, { slug })}>
					<ContentIcon icon={entry.icon} iconType={entry.iconType} />
					<span class="info">
						<span class="title">{entry.title}</span>
						<span class="meta">
							{#if entry.brief && !status?.total}
								<span class="progress">No versions yet</span>
							{:else if status?.total}
								<span class="progress" class:complete={status.read != null && status.read >= status.total}>
									{status.read ?? `?`}/{status.total} sections read
									{#if status.read != null && status.read >= status.total}<span title="Fully read">✓</span>{/if}
								</span>
							{/if}
							{#if entry.updatedAt}
								<span class="updated">Updated {format(parseISO(entry.updatedAt), `d MMM yyyy`)}</span>
							{/if}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.list {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.8em 1.2em;
		border-radius: 0.5em;
		background: var(--navy);
		color: var(--navy_text);
		text-decoration: none;
		font-weight: 600;

		&:hover .title {
			text-decoration: underline;
		}
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		font-weight: 400;
		font-size: 0.8em;
		color: var(--neutral);
	}

	.progress {
		&.complete {
			color: var(--green);
			font-weight: 600;
		}
	}
</style>
