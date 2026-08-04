<script lang="ts">
	import { page } from '$app/state';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import BookCard from '$components/parts/books/BookCard.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import type { Series } from '$types/generated';

	let seriesList = $state<Series[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleSeries(res: any) {
				seriesList = res.series ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'book-series',
				onStale: handleSeries,
				gqlQuery: `
					query {
						series {
							name
							slug
							authors { name slug }
							books {
								id name author series seriesNumber format thumbnail
							}
						}
					}
				`,
			}).then(handleSeries);
		}
	});

	const series = $derived(seriesList.find((s) => s?.slug === page.params.slug));
	const authors = $derived((series?.authors ?? []).filter((a) => a != null));
	const books = $derived(
		(series?.books ?? [])
			.filter((b) => b != null)
			.sort((a, b) => (a.seriesNumber ?? Infinity) - (b.seriesNumber ?? Infinity))
	);
</script>

<svelte:head>
	<title>{getPageTitle(`${series?.name ?? 'Series'} Books`)}</title>
</svelte:head>

<nav class="breadcrumb">
	<a href={resolve('/reference/books')}>Books</a>
	<span>/</span>
	<a href={resolve('/reference/books/series')}>Series</a>
	<span>/</span>
	<span>{series?.name ?? ''}</span>
</nav>

{#if loading}
	<Skeleton rows={3} />
{:else if !series}
	<EmptyState title="Series not found" />
{:else}
	<h1>{series.name}</h1>

	{#if authors.length}
		<ul class="author-links">
			{#each authors as a (a.slug)}
				<li>
					<a href={resolve('/reference/books/authors/[slug]', { slug: a.slug! })}>{a.name}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if books.length === 0}
		<EmptyState title="No books found in this series" />
	{:else}
		<p class="count">{books.length} books</p>

		<div class="grid">
			{#each books as book (book.id)}
				<BookCard {book} />
			{/each}
		</div>
	{/if}
{/if}

<style>
	.breadcrumb {
		display: flex;
		margin-bottom: 1em;
		font-size: 0.9em;
		gap: 0.4em;

		& a {
			color: var(--purple_bright);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		& span {
			color: var(--grey);
		}
	}

	.author-links {
		display: flex;
		flex-wrap: wrap;
		margin: 0 0 1.5em;
		padding: 0;
		list-style: none;
		gap: 0.5em;

		& a {
			display: inline-block;
			padding: 0.3em 0.7em;
			border: 1px solid var(--purple_bright);
			border-radius: 0.3em;
			color: var(--purple_bright);
			font-size: 0.85em;
			text-decoration: none;

			&:hover {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}
	}

	.count {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.85em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5em;
	}
</style>
