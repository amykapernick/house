<script lang="ts">
	import { resolve } from '$app/paths';
	import { slugifyHeading } from '$utils/markdown';

	type BookSummary = {
		id?: string | null;
		name?: string | null;
		author?: (string | null)[] | null;
		series?: string | null;
		seriesNumber?: number | null;
		format?: (string | null)[] | null;
		thumbnail?: string | null;
	};

	let { book }: { book: BookSummary } = $props();

	const authors = $derived(
		(book.author ?? [])
			.filter((name): name is string => !!name)
			.map((name) => ({ name, slug: slugifyHeading(name) }))
	);
</script>

<div class="card">
	{#if book.thumbnail}
		<img
			src={book.thumbnail}
			alt={book.name}
			loading="lazy"
		/>
	{:else}
		<div class="no-image"></div>
	{/if}
	<div class="info">
		<h2>{book.name}</h2>
		{#if authors.length}
			<p class="author">
				{#each authors as author, i (author.slug)}
					{i > 0 ? `, ` : ``}<a href={resolve('/reference/books/authors/[slug]', { slug: author.slug })}>{author.name}</a>
				{/each}
			</p>
		{/if}
		{#if book.series}
			<p class="series">
				<a href={resolve('/reference/books/series/[slug]', { slug: slugifyHeading(book.series) })}>{book.series}</a>{#if book.seriesNumber} #{book.seriesNumber}{/if}
			</p>
		{/if}
		{#if book.format?.length}
			<ul class="formats">
				{#each book.format as format (format)}
					<li>{format}</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.card {
		overflow: hidden;
		border: 1px solid var(--grey_light);
		border-radius: 0.5em;

		& img {
			display: block;
			width: 100%;
			height: 180px;
			object-fit: cover;
		}

		& .no-image {
			width: 100%;
			height: 180px;
			background: color-mix(in oklch, var(--purple_bright) 8%, var(--transparent));
		}
	}

	.info {
		padding: 0.8em;

		& h2 {
			margin: 0 0 0.3em;
			font-size: 1em;
			line-height: 1.3;
		}
	}

	.author,
	.series {
		margin: 0 0 0.3em;
		color: var(--grey);
		font-size: 0.85em;

		& a {
			color: inherit;
			text-decoration: none;

			&:hover {
				color: var(--purple_bright);
				text-decoration: underline;
			}
		}
	}

	.formats {
		display: flex;
		flex-wrap: wrap;
		margin: 0.5em 0 0;
		padding: 0;
		list-style: none;
		gap: 4px;

		& li {
			padding: 0.1em 0.4em;
			border: 1px solid var(--blue);
			border-radius: 0.2em;
			background: var(--blue);
			color: var(--blue_text);
			font-size: 0.7em;
		}
	}
</style>
