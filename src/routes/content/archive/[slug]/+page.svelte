<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { CONTENT_CACHE_TTL, ARCHIVE_PAGE_SLUG, contentEntriesQuery, contentArchiveQuery, contentArchiveCacheKey } from '$utils/content';
	import { getReadAnchors, markAnchorRead, unmarkAnchorRead } from '$utils/readProgress';
	import { extractToc, splitTrackableChunks } from '$utils/markdown';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import TableOfContents from '$components/parts/content/TableOfContents.svelte';
	import TrackableContent from '$components/parts/content/TrackableContent.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import type { ContentEntry, ContentPage } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';

	let entry = $state<ContentEntry | null>(null);
	let archive = $state<ContentPage | null>(null);
	let loading = $state(true);
	let showToc = $state(false);

	// Which Chapter (h3), or bare Section (h2 with no chapters), anchors this
	// device has already read - per-device (localStorage), scoped under
	// ARCHIVE_PAGE_SLUG so it never collides with this slug's live digest
	// progress at /content/[slug].
	let readAnchors = new SvelteSet<string>();
	let hasResumedScroll = $state(false);

	$effect(() => {
		const slug = $page.params.slug ?? ``;

		if ($isAuthenticated && slug) {
			loading = true;
			archive = null;
			readAnchors.clear();
			for (const anchor of getReadAnchors(slug, ARCHIVE_PAGE_SLUG)) readAnchors.add(anchor);
			hasResumedScroll = false;

			fetchClientData({
				cacheKey: `content-entries`,
				gqlQuery: contentEntriesQuery,
			}).then((res: any) => {
				entry = (res.contentEntries ?? []).find((e: ContentEntry) => e?.slug === slug) ?? null;
			});

			function handleArchive(res: any) {
				archive = res.contentArchive ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: contentArchiveCacheKey(slug),
				ttl: CONTENT_CACHE_TTL,
				onStale: handleArchive,
				gqlQuery: contentArchiveQuery(slug),
			}).then(handleArchive);
		}
	});

	let toc = $derived(archive?.content ? extractToc(archive.content) : []);
	let chunks = $derived(archive?.content ? splitTrackableChunks(archive.content) : []);

	// Whether every trackable chunk on this page has been read - shown as a
	// "fully read" badge next to the page title, mirroring /content/[slug].
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
			unmarkAnchorRead(slug, ARCHIVE_PAGE_SLUG, anchor);
			readAnchors.delete(anchor);
			return;
		}

		markAnchorRead(slug, ARCHIVE_PAGE_SLUG, anchor);
		readAnchors.add(anchor);
	}
</script>

<svelte:head>
	<title>{getPageTitle(entry?.title ? `${entry.title} Archive` : `Archive`)}</title>
</svelte:head>

<a href={resolve(`/content/archive`)} class="back">← Archive</a>

<h1><ContentIcon icon={entry?.icon} iconType={entry?.iconType} />{entry?.title ?? $page.params.slug} Archive{#if allRead}<span class="read-mark" title="Fully read">✓</span>{/if}</h1>
{#if loading}
	<Skeleton rows={3} />
{:else if !archive?.content}
	<EmptyState title="No archived versions yet" />
{:else}
	<TableOfContents {toc} {readAnchors} bind:showToc />
	<TrackableContent {chunks} {readAnchors} onToggleRead={handleToggleRead} />
{/if}

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
