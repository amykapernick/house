<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { extractToc, splitTrackableChunks } from '$utils/markdown';
	import { CONTENT_CACHE_TTL, contentEntriesQuery, contentPageQuery } from '$utils/content';
	import { getReadAnchors, markAnchorRead, unmarkAnchorRead } from '$utils/readProgress';
	import TableOfContents from '$components/parts/content/TableOfContents/index.svelte';
	import TrackableContent from '$components/parts/content/TrackableContent/index.svelte';
	import Skeleton from '$components/parts/Skeleton/index.svelte';
	import type { ContentEntry, ContentPage } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';

	let entry = $state<ContentEntry | null>(null);

	// This content never changes once fetched - cache it for a long time, but
	// only once this page is actually visited (no bulk prefetch from the index
	// page - the combined ~5.7MB of course text risks blowing localStorage's
	// quota if every course were warmed up eagerly).
	let contentPage = $state<ContentPage | null>(null);
	let loading = $state(true);

	// Which Chapter (h3), or bare Section (h2 with no chapters), anchors this
	// device has already read - per-device (localStorage), reset/reloaded
	// whenever the slug/pageSlug changes.
	let readAnchors = new SvelteSet<string>();
	let hasResumedScroll = $state(false);
	let showToc = $state(true);

	function loadReadAnchors(slug: string, pageSlug: string) {
		readAnchors.clear();
		for (const anchor of getReadAnchors(slug, pageSlug)) readAnchors.add(anchor);
	}

	$effect(() => {
		const slug = $page.params.slug ?? ``;
		const pageSlug = $page.params.pageSlug ?? ``;

		if ($isAuthenticated && slug && pageSlug) {
			loading = true;
			loadReadAnchors(slug, pageSlug);
			hasResumedScroll = false;

			fetchClientData({
				cacheKey: `content-entries`,
				gqlQuery: contentEntriesQuery,
			}).then((res: any) => {
				entry = (res.contentEntries ?? []).find((e: ContentEntry) => e?.slug === slug) ?? null;
			});

			function handlePage(res: any) {
				contentPage = res.contentPage ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: `content-page-${slug}-${pageSlug}`,
				ttl: CONTENT_CACHE_TTL,
				onStale: handlePage,
				gqlQuery: contentPageQuery(slug, pageSlug),
			}).then(handlePage);
		}
	});

	let toc = $derived(contentPage?.content ? extractToc(contentPage.content) : []);
	let chunks = $derived(contentPage?.content ? splitTrackableChunks(contentPage.content) : []);

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
		const pageSlug = $page.params.pageSlug ?? ``;
		if (!slug || !pageSlug) return;

		if (readAnchors.has(anchor)) {
			unmarkAnchorRead(slug, pageSlug, anchor);
			readAnchors.delete(anchor);
			return;
		}

		markAnchorRead(slug, pageSlug, anchor);
		readAnchors.add(anchor);
	}
</script>

<svelte:head>
	<title>{getPageTitle(contentPage?.title ?? `Content`)}</title>
</svelte:head>

<a href={resolve(`/content/[slug]`, { slug: $page.params.slug ?? `` })} class="back">← {entry?.title ?? $page.params.slug}</a>

{#if loading}
	<Skeleton rows={3} />
{:else if !contentPage}
	<p>Page not found.</p>
{:else}
	<h1>{contentPage.title}</h1>

	<TableOfContents {toc} {readAnchors} bind:showToc />
	<TrackableContent {chunks} {readAnchors} onToggleRead={handleToggleRead} />
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.back {
		display: inline-block;
		margin-bottom: 10px;
		color: var(--purple_bright);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
