<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { renderMarkdown, extractToc, splitTrackableChunks } from '$utils/markdown';
	import { CONTENT_CACHE_TTL, contentEntriesQuery, contentPageQuery } from '$utils/content';
	import { getReadAnchors, markAnchorRead, unmarkAnchorRead, trackReadDwell } from '$utils/readProgress';
	import type { ContentEntry, ContentPage } from '$types/generated';

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

	// Whether each TOC entry counts as "read", for its checkmark. Chapters (h3)
	// and bare sections (h2 with no chapters) map straight onto a trackable
	// chunk's own anchor. A section (h2) *with* chapters isn't itself
	// trackable (see splitTrackableChunks) - it only reads as done once every
	// chapter nested under it (up to the next h2) has been read.
	let tocRead = $derived.by(() => {
		const read = new SvelteMap<string, boolean>();

		toc.forEach((entry, i) => {
			if (entry.level === 3) {
				read.set(entry.anchor, readAnchors.has(entry.anchor));
				return;
			}

			const chapters = [];
			for (let j = i + 1; j < toc.length && toc[j].level !== 2; j++) chapters.push(toc[j]);

			read.set(entry.anchor, chapters.length > 0 ? chapters.every((chapter) => readAnchors.has(chapter.anchor)) : readAnchors.has(entry.anchor));
		});

		return read;
	});

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
	<title>{contentPage?.title ?? `Content`} | Kapers Crewe Household</title>
</svelte:head>

<a href={resolve(`/content/[slug]`, { slug: $page.params.slug ?? `` })} class="back">← {entry?.title ?? $page.params.slug}</a>

{#if loading}
	<p>Loading...</p>
{:else if !contentPage}
	<p>Page not found.</p>
{:else}
	<h1>{contentPage.title}</h1>

	{#if toc.length > 0}
		<button type="button" class="toc-toggle" onclick={() => showToc = !showToc}>
			{showToc ? `Hide contents` : `Show contents`}
		</button>
		{#if showToc}
			<nav class="toc" aria-label="Table of contents">
				<ol>
					{#each toc as entry (entry.anchor)}
						<li class:chapter={entry.level === 3}>
							<a href="#{entry.anchor}">{entry.text}</a>
							{#if tocRead.get(entry.anchor)}
								<span class="read-mark" title="Read">✓</span>
							{/if}
						</li>
					{/each}
				</ol>
			</nav>
		{/if}
	{/if}

	<div class="content">
		{#each chunks as chunk (chunk.anchor ?? `intro`)}
			<div id={chunk.anchor ?? undefined}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- chunk.markdown is Amy's own curated Notion data, not user input -->
				{@html renderMarkdown(chunk.markdown)}
			</div>
			{#if chunk.trackable && chunk.anchor}
				{@const anchor = chunk.anchor}
				<button
					type="button"
					class="mark-read"
					class:read={readAnchors.has(anchor)}
					onclick={() => handleToggleRead(anchor)}
					use:trackReadDwell={{ anchor, isAlreadyRead: () => readAnchors.has(anchor), onRead: handleToggleRead }}
				>
					{readAnchors.has(anchor) ? `Marked as read - click to undo` : `Mark this section as read`}
				</button>
			{/if}
		{/each}
	</div>
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

	.toc-toggle {
		margin: 20px 0 0;
		padding: 0.5em 1em;
		border: 1px solid var(--navy);
		border-radius: 0.35em;
		background: none;
		color: var(--navy);
		font-size: 0.85em;
		cursor: pointer;
	}

	.toc {
		margin: 10px 0 20px;
		padding: 15px 20px;
		border-radius: 0.5em;
		background: var(--navy);
		color: var(--navy_text);

		& ol {
			margin: 0;
			padding-left: 1.2em;
		}

		& li.chapter {
			margin-left: 1em;
			list-style: circle;
		}

		& a {
			color: inherit;
		}
	}

	.read-mark {
		margin-left: 0.4em;
		color: var(--green);
	}

	.mark-read {
		margin: 1.5em 0 0;
		padding: 0.5em 1em;
		border: 1px solid var(--navy);
		border-radius: 0.35em;
		background: none;
		color: var(--navy);
		font-size: 0.85em;
		cursor: pointer;

		&.read {
			border-color: var(--green);
			color: var(--green);
		}
	}

	.content {
		max-width: 70ch;
		line-height: 1.6;

		:global(h2) {
			margin-top: 2em;
			padding-bottom: 0.2em;
			border-bottom: 2px solid var(--navy);
		}

		:global(h3) {
			margin-top: 1.5em;
		}

		:global(img) {
			max-width: 100%;
		}
	}
</style>
