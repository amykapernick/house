<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import BookCard from '$components/parts/books/BookCard.svelte';
	import Pagination from '$components/parts/Pagination.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import type { Book } from '$types/generated';

	let books = $state<Book[]>([]);
	let loading = $state(true);
	let search = $state('');
	let page = $state(1);
	const perPage = 24;

	const filteredBooks = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return books;
		return books.filter((book) =>
			[book.name, book.series, ...(book.author ?? [])]
				.filter(Boolean)
				.some((value) => value!.toLowerCase().includes(query))
		);
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredBooks.length / perPage)));

	const pagedBooks = $derived(
		filteredBooks.slice((page - 1) * perPage, page * perPage)
	);

	$effect(() => {
		search;
		page = 1;
	});

	$effect(() => {
		if ($isAuthenticated) {
			function handleBooks(res: any) {
				books = res.books ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'books',
				onStale: handleBooks,
				gqlQuery: `
					query {
						books {
							id
							name
							author
							series
							seriesNumber
							format
							thumbnail
						}
					}
				`,
			}).then(handleBooks);
		}
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Books`)}</title>
</svelte:head>

<h1>Books</h1>

<form class="search" onsubmit={(e) => e.preventDefault()}>
	<input
		type="text"
		placeholder="Search books..."
		aria-label="Search books"
		bind:value={search}
	/>
</form>

{#if loading}
	<Skeleton rows={3} />
{:else if filteredBooks.length === 0}
	<EmptyState title="No books found" />
{:else}
	<p class="count">{filteredBooks.length} books</p>

	<div class="grid">
		{#each pagedBooks as book (book.id)}
			<BookCard {book} />
		{/each}
	</div>

	<Pagination currentPage={page} {totalPages} onPageChange={(p) => (page = p)} />
{/if}

<style>
	.search {
		margin-bottom: 1.5em;

		& input {
			width: 100%;
			padding: 0.5em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 1em;
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
