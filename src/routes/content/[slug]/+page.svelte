<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { CONTENT_CACHE_TTL, DIGEST_PAGE_SLUG, contentEntriesQuery, contentIndexQuery, contentDigestQuery, contentIndexCacheKey, contentDigestCacheKey } from '$utils/content';
	import { getReadAnchors, markAnchorRead, unmarkAnchorRead } from '$utils/readProgress';
	import { extractToc, splitTrackableChunks } from '$utils/markdown';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import TableOfContents from '$components/parts/content/TableOfContents.svelte';
	import TrackableContent from '$components/parts/content/TrackableContent.svelte';
	import ContentGroups from '$components/parts/content/ContentGroups.svelte';
	import type { ContentEntry, ContentGroup, ContentPage } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';

	let entry = $state<ContentEntry | null>(null);
	let groups = $state<ContentGroup[]>([]);
	let digest = $state<ContentPage | null>(null);
	let loading = $state(true);
	let showToc = $state(false);

	// Which Chapter (h3), or bare Section (h2 with no chapters), anchors this
	// device has already read - per-device (localStorage), reset/reloaded
	// whenever the slug changes. Only meaningful for digest-style content.
	let readAnchors = new SvelteSet<string>();
	let hasResumedScroll = $state(false);

	$effect(() => {
		const slug = $page.params.slug ?? ``;

		if ($isAuthenticated && slug) {
			loading = true;
			groups = [];
			digest = null;
			readAnchors.clear();
			for (const anchor of getReadAnchors(slug, DIGEST_PAGE_SLUG)) readAnchors.add(anchor);
			hasResumedScroll = false;

			// Short-lived (default TTL) - Notion's uploaded-file icon URLs expire
			// after about an hour, so entry metadata isn't cached alongside the
			// long-lived course/digest content below. Entry decides which content
			// query to run - a digest-style entry (has a Brief) combines its
			// versions into one page, a course-style entry lists linked subpages.
			fetchClientData({
				cacheKey: `content-entries`,
				gqlQuery: contentEntriesQuery,
			}).then((res: any) => {
				entry = (res.contentEntries ?? []).find((e: ContentEntry) => e?.slug === slug) ?? null;

				if (entry?.brief) {
					function handleDigest(res: any) {
						digest = res.contentDigest ?? null;
						loading = false;
					}
					fetchClientData({
						cacheKey: contentDigestCacheKey(slug),
						ttl: CONTENT_CACHE_TTL,
						onStale: handleDigest,
						gqlQuery: contentDigestQuery(slug),
					}).then(handleDigest);
				}
				else {
					function handleIndex(res: any) {
						groups = res.contentIndex ?? [];
						loading = false;
					}
					fetchClientData({
						cacheKey: contentIndexCacheKey(slug),
						ttl: CONTENT_CACHE_TTL,
						onStale: handleIndex,
						gqlQuery: contentIndexQuery(slug),
					}).then(handleIndex);
				}
			});
		}
	});

	let toc = $derived(digest?.content ? extractToc(digest.content) : []);
	let chunks = $derived(digest?.content ? splitTrackableChunks(digest.content) : []);

	// Whether every trackable chunk on this page has been read - shown as a
	// "fully read" badge next to the page title, mirroring the checkmark shown
	// for a fully-read course subpage in the groups listing below.
	let allRead = $derived(chunks.length > 0 && chunks.filter((chunk) => chunk.trackable).every((chunk) => chunk.anchor && readAnchors.has(chunk.anchor)));

	// Skip straight to wherever this device last left off, but only once per
	// page visit, and only if there's actually prior progress to resume.
	$effect(() => {
		if (hasResumedScroll || chunks.length === 0 || readAnchors.size === 0) return;
		hasResumedScroll = true;

		const firstUnread = chunks.find((chunk) => chunk.trackable && chunk.anchor && !readAnchors.has(chunk.anchor));
		if (!firstUnread?.anchor) return;

		const anchor = firstUnread.anchor;
		tick().then(() => document.getElementById(anchor)?.scrollIntoView({ block: `start` }));
	});

	// Also used as the dwell action's onRead - safe to reuse, since the dwell
	// action only ever calls onRead when its own isAlreadyRead() check is
	// false, so it can never accidentally toggle a chunk back to unread.
	function handleToggleRead(anchor: string) {
		const slug = $page.params.slug ?? ``;
		if (!slug) return;

		if (readAnchors.has(anchor)) {
			unmarkAnchorRead(slug, DIGEST_PAGE_SLUG, anchor);
			readAnchors.delete(anchor);
			return;
		}

		markAnchorRead(slug, DIGEST_PAGE_SLUG, anchor);
		readAnchors.add(anchor);
	}
</script>

<svelte:head>
	<title>{getPageTitle(entry?.title ?? `Content`)}</title>
</svelte:head>

<h1><ContentIcon icon={entry?.icon} iconType={entry?.iconType} />{entry?.title ?? $page.params.slug}{#if allRead}<span class="read-mark" title="Fully read">✓</span>{/if}</h1>
{#if loading}
	<p>Loading...</p>
{:else if entry?.brief}
	{#if !digest?.content}
		<p>No versions yet.</p>
	{:else}
		<TableOfContents {toc} {readAnchors} bind:showToc />
		<TrackableContent {chunks} {readAnchors} onToggleRead={handleToggleRead} />
	{/if}
{:else}
	<ContentGroups {groups} slug={$page.params.slug ?? ``} />
{/if}

<style>
	h1 {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.read-mark {
		margin-left: 0.4em;
		color: var(--green);
	}
</style>
