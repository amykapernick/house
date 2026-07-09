<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { renderMarkdown, extractToc } from '$utils/markdown';
	import { POSSUMS_CACHE_TTL } from '$utils/possums';
	import type { PossumsCourse } from '$types/generated';

	// This content never changes once fetched - cache it for a long time, but
	// only once this page is actually visited (no bulk prefetch from the index
	// page - the combined ~5.7MB of course text risks blowing localStorage's
	// quota if every course were warmed up eagerly).
	let course = $state<PossumsCourse | null>(null);
	let loading = $state(true);

	$effect(() => {
		const slug = $page.params.slug ?? ``;

		if ($isAuthenticated && slug) {
			loading = true;

			function handleCourse(res: any) {
				course = res.possumsCourse ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: `possums-course-${slug}`,
				ttl: POSSUMS_CACHE_TTL,
				onStale: handleCourse,
				gqlQuery: `
					query {
						possumsCourse(slug: "${slug}") {
							slug title content
						}
					}
				`,
			}).then(handleCourse);
		}
	});

	let toc = $derived(course?.content ? extractToc(course.content) : []);
	let html = $derived(course?.content ? renderMarkdown(course.content) : ``);
</script>

<svelte:head>
	<title>{course?.title ?? `Possums`} | Kapers Crewe Household</title>
</svelte:head>

<a href={resolve(`/content/possums`)} class="back">← Possums</a>

{#if loading}
	<p>Loading...</p>
{:else if !course}
	<p>Course not found.</p>
{:else}
	<h1>{course.title}</h1>

	{#if toc.length > 0}
		<nav class="toc" aria-label="Table of contents">
			<ol>
				{#each toc as entry (entry.anchor)}
					<li class:chapter={entry.level === 3}>
						<a href="#{entry.anchor}">{entry.text}</a>
					</li>
				{/each}
			</ol>
		</nav>
	{/if}

	<!-- eslint-disable-next-line svelte/no-at-html-tags -- course.content is Amy's own curated Notion data, not user input -->
	<div class="content">{@html html}</div>
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

	.toc {
		margin: 20px 0;
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
