<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import type { Series } from '$types/generated';

	let series = $state<Series[]>([]);
	let loading = $state(true);
	let search = $state('');

	$effect(() => {
		if ($isAuthenticated) {
			function handleSeries(res: any) {
				series = (res.series ?? []).slice().sort((a: Series, b: Series) =>
					(a.name ?? ``).localeCompare(b.name ?? ``)
				);
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

	const filteredSeries = $derived(
		search
			? series.filter((s) => (s.name ?? ``).toLowerCase().includes(search.toLowerCase()))
			: series
	);
</script>

<svelte:head>
	<title>{getPageTitle(`Book Series`)}</title>
</svelte:head>

<a href={resolve('/reference/books')} class="back">← Books</a>

<h1>Series</h1>

{#if loading}
	<Skeleton rows={3} />
{:else if series.length === 0}
	<EmptyState title="No series found" />
{:else}
	<input
		type="text"
		class="filter"
		placeholder="Filter series..."
		aria-label="Filter series"
		bind:value={search}
	/>

	<p class="count">{filteredSeries.length} series</p>

	<div class="grid">
		{#each filteredSeries as s (s.slug)}
			<a class="series-card" href={resolve('/reference/books/series/[slug]', { slug: s.slug! })}>
				{s.name} ({s.books?.length ?? 0})
			</a>
		{/each}
	</div>
{/if}

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

	.series-card {
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
