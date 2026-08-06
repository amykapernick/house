<script lang="ts">
	import { onMount } from 'svelte';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$parts/Skeleton/index.svelte';

	let tags = $state<any[]>([]);
	let loading = $state(true);
	let search = $state('');

	onMount(() => {
		function handleTags(res: any) {
			tags = (res.recipeTags ?? []).sort((a: any, b: any) =>
				a.name.localeCompare(b.name)
			);
			loading = false;
		}
		fetchClientData({
			cacheKey: 'recipe-tags',
			onStale: handleTags,
			gqlQuery: `
				query {
					recipeTags {
						id name slug
					}
				}
			`,
		}).then(handleTags);
	});

	let filteredTags = $derived(
		search
			? tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
			: tags
	);
</script>

<svelte:head>
	<title>{getPageTitle(`Recipe Tags`)}</title>
</svelte:head>

<a href={resolve('/recipes')} class="back">← Recipes</a>

<h1>Tags</h1>

{#if loading}
	<Skeleton rows={3} />
{:else}
	<input
		type="text"
		class="filter"
		placeholder="Filter tags..."
		aria-label="Filter tags"
		bind:value={search}
	/>

	<p class="count">{filteredTags.length} tags</p>

	<div class="grid">
		{#each filteredTags as tag (tag.slug)}
			<a class="tag-card" href={resolve('/recipes/tags/[slug]', { slug: tag.slug })}>
				{tag.name}
			</a>
		{/each}
	</div>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	@import '@mixins';

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

	.tag-card {
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
