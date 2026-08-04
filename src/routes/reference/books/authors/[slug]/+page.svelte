<script lang="ts">
	import { page } from '$app/state';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import BookCard from '$components/parts/books/BookCard.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import type { Author } from '$types/generated';

	let authors = $state<Author[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleAuthors(res: any) {
				authors = res.authors ?? [];
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

	const author = $derived(authors.find((a) => a?.slug === page.params.slug));
	const books = $derived((author?.books ?? []).filter((b) => b != null));
	const series = $derived((author?.series ?? []).filter((s) => s != null));
</script>

<svelte:head>
	<title>{getPageTitle(`${author?.name ?? 'Author'} Books`)}</title>
</svelte:head>

<nav class="breadcrumb">
	<a href={resolve('/reference/books')}>Books</a>
	<span>/</span>
	<a href={resolve('/reference/books/authors')}>Authors</a>
	<span>/</span>
	<span>{author?.name ?? ''}</span>
</nav>

{#if loading}
	<Skeleton rows={3} />
{:else if !author}
	<EmptyState title="Author not found" />
{:else}
	<h1>{author.name}</h1>

	{#if series.length}
		<ul class="series-links">
			{#each series as s (s.slug)}
				<li>
					<a href={resolve('/reference/books/series/[slug]', { slug: s.slug! })}>{s.name}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if books.length === 0}
		<EmptyState title="No books found for this author" />
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

	.series-links {
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
