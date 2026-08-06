<script lang="ts">
	import { resolve } from '$app/paths';
	import { slugifyHeading } from '$utils/markdown';
	import styles from './index.module.css';

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

	const authors = $derived((book.author ?? []).filter((name): name is string => !!name).map((name) => ({ name, slug: slugifyHeading(name) })));
</script>

<div class={styles.card}>
	{#if book.thumbnail}
		<div
			class={styles.image}
			style={`--image-url: url(${book.thumbnail})`}
		>
			<img
				src={book.thumbnail}
				alt={book.name}
				loading="lazy"
			/>
		</div>
	{:else}
		<div class={styles['no-image']}></div>
	{/if}
	<div class={styles.info}>
		<h2>{book.name}</h2>
		{#if authors.length}
			<p class={styles.author}>
				{#each authors as author, i (author.slug)}
					{i > 0 ? `, ` : ``}<a href={resolve('/reference/books/authors/[slug]', { slug: author.slug })}>{author.name}</a>
				{/each}
			</p>
		{/if}
		{#if book.series}
			<p class={styles.series}>
				<a href={resolve('/reference/books/series/[slug]', { slug: slugifyHeading(book.series) })}>{book.series}</a>{#if book.seriesNumber}
					#{book.seriesNumber}{/if}
			</p>
		{/if}
		{#if book.format?.length}
			<ul class={styles.formats}>
				{#each book.format as format (format)}
					<li>{format}</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
