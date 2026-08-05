<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData, { clearCache } from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { addBookMutation } from '$utils/books';
	import BookCard from '$components/parts/books/BookCard.svelte';
	import AddBookModal from '$components/parts/books/AddBookModal.svelte';
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

	function fetchBooks() {
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

	const filteredBooks = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return books;
		return books.filter((book) => [book.name, book.series, ...(book.author ?? [])].filter(Boolean).some((value) => value!.toLowerCase().includes(query)));
	});

	const totalPages = $derived(Math.max(1, Math.ceil(filteredBooks.length / perPage)));

	const pagedBooks = $derived(filteredBooks.slice((page - 1) * perPage, page * perPage));

	$effect(() => {
		search;
		page = 1;
	});

	$effect(() => {
		if ($isAuthenticated) fetchBooks();
	});

	// Add book modal
	let addModalOpen = $state(false);
	let draftIsbn = $state(``);
	let draftName = $state(``);
	let draftAuthor = $state(``);
	let draftSeries = $state(``);
	let draftSeriesNumber = $state(``);
	let draftThumbnail = $state(``);
	let addSaving = $state(false);
	let addError = $state(``);

	function openAddModal() {
		draftIsbn = ``;
		draftName = ``;
		draftAuthor = ``;
		draftSeries = ``;
		draftSeriesNumber = ``;
		draftThumbnail = ``;
		addError = ``;
		addModalOpen = true;
	}

	async function handleAddBook() {
		addSaving = true;
		addError = ``;

		const res = await fetchClientData({
			gqlQuery: addBookMutation({
				isbn: draftIsbn.trim(),
				name: draftName.trim(),
				author: draftAuthor
					.split(`,`)
					.map((a) => a.trim())
					.filter(Boolean),
				series: draftSeries.trim() || undefined,
				seriesNumber: draftSeriesNumber ? Number(draftSeriesNumber) : undefined,
				thumbnail: draftThumbnail.trim() || undefined,
			}),
		});

		addSaving = false;

		if (!res?.addBook) {
			addError = `Couldn't add book. Try again.`;
			return;
		}

		addModalOpen = false;
		clearCache('books');
		fetchBooks();
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Books`)}</title>
</svelte:head>

<h1>Books</h1>

<button
	type="button"
	class="add"
	onclick={openAddModal}>Add book</button
>

<AddBookModal
	bind:open={addModalOpen}
	bind:isbn={draftIsbn}
	bind:name={draftName}
	bind:author={draftAuthor}
	bind:series={draftSeries}
	bind:seriesNumber={draftSeriesNumber}
	bind:thumbnail={draftThumbnail}
	saving={addSaving}
	error={addError}
	onSave={handleAddBook}
/>

<nav class="browse">
	<a href={resolve('/reference/books/authors')}>Browse by author</a>
	<a href={resolve('/reference/books/series')}>Browse by series</a>
</nav>

<form
	class="search"
	onsubmit={(e) => e.preventDefault()}
>
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

	<Pagination
		currentPage={page}
		{totalPages}
		onPageChange={(p) => (page = p)}
	/>
{/if}

<style>
	@import '@mixins';

	.add {

		@include button_secondary;

		margin-bottom: 1em;
	}

	.browse {
		display: flex;
		margin-bottom: 1em;
		gap: 1em;

		& a {
			color: var(--purple_bright);
			font-size: 0.9em;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

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
