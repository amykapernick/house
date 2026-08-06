<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$components/parts/Skeleton/index.svelte';
	import EmptyState from '$components/parts/EmptyState/index.svelte';
	import type { Author } from '$types/generated';

	let authors = $state<Author[]>([]);
	let loading = $state(true);
	let search = $state('');

	$effect(() => {
		if ($isAuthenticated) {
			function handleAuthors(res: any) {
				authors = (res.authors ?? []).slice().sort((a: Author, b: Author) =>
					(a.name ?? ``).localeCompare(b.name ?? ``)
				);
				loading = false;
			}
			fetchClientData({
				cacheKey: 'book-authors',
				onStale: handleAuthors,
				gqlQuery: `
					query {
						authors {
							name
							slug
							series { name slug }
							books {
								id name author series seriesNumber format thumbnail
							}
						}
					}
				`,
			}).then(handleAuthors);
		}
	});

	const filteredAuthors = $derived(
		search
			? authors.filter((a) => (a.name ?? ``).toLowerCase().includes(search.toLowerCase()))
			: authors
	);
</script>

<svelte:head>
	<title>{getPageTitle(`Book Authors`)}</title>
</svelte:head>

<a href={resolve('/reference/books')} class="back">← Books</a>

<h1>Authors</h1>

{#if loading}
	<Skeleton rows={3} />
{:else if authors.length === 0}
	<EmptyState title="No authors found" />
{:else}
	<input
		type="text"
		class="filter"
		placeholder="Filter authors..."
		aria-label="Filter authors"
		bind:value={search}
	/>

	<p class="count">{filteredAuthors.length} authors</p>

	<div class="grid">
		{#each filteredAuthors as author (author.slug)}
			<a class="author-card" href={resolve('/reference/books/authors/[slug]', { slug: author.slug! })}>
				{author.name} ({author.books?.length ?? 0})
			</a>
		{/each}
	</div>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.back {
		display: inline-block;
		margin-bottom: 1em;
		color: var(--purple_bright);
		font-size: 0.9em;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	.filter {
		width: 100%;
		max-width: 400px;
		margin-bottom: 1em;
		padding: 0.5em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		font-size: 1em;
	}

	.count {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.85em;
	}

	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.author-card {
		display: inline-block;
		padding: 0.4em 0.8em;
		transition: background 0.15s, border-color 0.15s;
		border: 1px solid var(--blue);
		border-radius: 0.3em;
		background: var(--blue);
		color: var(--blue_text);
		font-size: 0.9em;
		text-decoration: none;

		&:hover {
			border-color: var(--purple_bright);
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}
	}
</style>
