<script lang="ts">
	import { tick } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { CONTENT_CACHE_TTL, DIGEST_PAGE_SLUG, contentEntriesQuery, contentIndexQuery, contentDigestQuery, contentIndexCacheKey, contentDigestCacheKey } from '$utils/content';
	import { getReadAnchors, markAnchorRead, unmarkAnchorRead, trackReadDwell } from '$utils/readProgress';
	import { renderMarkdown, extractToc, splitTrackableChunks } from '$utils/markdown';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import type { ContentEntry, ContentGroup, ContentPage } from '$types/generated';

	let entry = $state<ContentEntry | null>(null);
	let groups = $state<ContentGroup[]>([]);
	let digest = $state<ContentPage | null>(null);
	let loading = $state(true);
	let showToc = $state(true);

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

	// Whether each TOC entry counts as "read", for its checkmark. Chapters (h3)
	// and bare sections (h2 with no chapters) map straight onto a trackable
	// chunk's own anchor. A section (h2) *with* chapters isn't itself
	// trackable (see splitTrackableChunks) - it only reads as done once every
	// chapter nested under it (up to the next h2) has been read.
	let tocRead = $derived.by(() => {
		const read = new SvelteMap<string, boolean>();

		toc.forEach((tocEntry, i) => {
			if (tocEntry.level === 3) {
				read.set(tocEntry.anchor, readAnchors.has(tocEntry.anchor));
				return;
			}

			const chapters = [];
			for (let j = i + 1; j < toc.length && toc[j].level !== 2; j++) chapters.push(toc[j]);

			read.set(tocEntry.anchor, chapters.length > 0 ? chapters.every((chapter) => readAnchors.has(chapter.anchor)) : readAnchors.has(tocEntry.anchor));
		});

		return read;
	});

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
	<title>{entry?.title ?? `Content`} | Kapers Crewe Household</title>
</svelte:head>

<h1><ContentIcon icon={entry?.icon} iconType={entry?.iconType} />{entry?.title ?? $page.params.slug}{#if allRead}<span class="read-mark" title="Fully read">✓</span>{/if}</h1>
{#if loading}
	<p>Loading...</p>
{:else if entry?.brief}
	{#if !digest?.content}
		<p>No versions yet.</p>
	{:else}
		{#if toc.length > 0}
			<button type="button" class="toc-toggle" onclick={() => showToc = !showToc}>
				{showToc ? `Hide contents` : `Show contents`}
			</button>
			{#if showToc}
				<nav class="toc" aria-label="Table of contents">
					<ol>
						{#each toc as tocEntry (tocEntry.anchor)}
							<li class:chapter={tocEntry.level === 3}>
								<a href="#{tocEntry.anchor}">{tocEntry.text}</a>
								{#if tocRead.get(tocEntry.anchor)}
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
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- chunk.markdown is AI-generated but curated/reviewed via Notion, not raw user input -->
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
{:else}
	<div class="groups">
		{#each groups as group (group.title)}
			<section class="group">
				<h2>{group.title}</h2>
				{#if group.description}
					<p>{group.description}</p>
				{/if}
				<ul class="list">
					{#each group.pages ?? [] as contentPage (contentPage?.slug)}
						<li>
							<a href={resolve(`/content/[slug]/[pageSlug]`, { slug: $page.params.slug ?? ``, pageSlug: contentPage?.slug ?? `` })}>{contentPage?.title}</a>
							{#if contentPage?.slug && contentPage.sectionCount}
								{@const readCount = getReadAnchors($page.params.slug ?? ``, contentPage.slug).size}
								{@const complete = readCount >= contentPage.sectionCount}
								<span class="progress" class:complete>
									{readCount}/{contentPage.sectionCount}
									{#if complete}<span title="Fully read">✓</span>{/if}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	h1 {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.groups {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.group {
		flex: 1 1 300px;
		padding: 20px;
		border-radius: 0.5em;
		background: var(--navy);
		color: var(--navy_text);

		& h2 {
			margin-top: 0;
		}
	}

	.list {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 5px;

		& a {
			color: inherit;
			font-weight: 600;

			&:hover {
				text-decoration: underline;
			}
		}

		& .progress {
			margin-left: 0.4em;
			color: var(--neutral);
			font-size: 0.85em;

			&.complete {
				color: var(--green);
				font-weight: 600;
			}
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
