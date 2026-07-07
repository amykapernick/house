<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { intervalToDuration } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';

	function formatMinutes(mins: number | string | null): string {
		if (!mins) return '';
		const m = typeof mins === 'string' ? parseInt(mins, 10) : mins;
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

	let recipes = $state<any[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let tagName = $state('');
	const perPage = 24;

	function fetchRecipes() {
		loading = true;
		const slug = $page.params.slug ?? '';

		fetchClientData({
			gqlQuery: `
				query {
					recipes(page: ${currentPage}, perPage: ${perPage}, tags: ["${slug}"]) {
						page perPage total totalPages
						items {
							id name slug image description
							totalTime prepTime cookTime
							servings rating
							tags { name slug }
							categories { name slug }
						}
					}
				}
			`,
		}).then((res) => {
			const data = res.recipes;
			recipes = data?.items ?? [];
			totalPages = data?.totalPages ?? 1;
			total = data?.total ?? 0;
			if (recipes.length && !tagName) {
				const match = recipes[0].tags?.find((t: any) => t.slug === slug);
				if (match) tagName = match.name;
			}
			if (!tagName) tagName = slug.replaceAll('-', ' ');
			loading = false;
		});
	}

	onMount(() => {
		fetchRecipes();
	});

	function goToPage(p: number) {
		currentPage = p;
		fetchRecipes();
	}
</script>

<svelte:head>
	<title>{tagName || 'Tag'} Recipes | Kapers Crewe Household</title>
</svelte:head>

<nav class="breadcrumb">
	<a href={resolve('/recipes')}>Recipes</a>
	<span>/</span>
	<a href={resolve('/recipes/tags')}>Tags</a>
	<span>/</span>
	<span>{tagName}</span>
</nav>

<h1>{tagName}</h1>

{#if loading}
	<p>Loading...</p>
{:else if recipes.length === 0}
	<p>No recipes found with this tag.</p>
{:else}
	<p class="count">{total} recipes</p>

	<div class="grid">
		{#each recipes as recipe (recipe.slug)}
			<a class="card" href={resolve('/recipes/[slug]', { slug: recipe.slug })}>
				{#if recipe.image}
					<img src={recipe.image} alt={recipe.name} loading="lazy" />
				{:else}
					<div class="no-image"></div>
				{/if}
				<div class="info">
					<h2>{recipe.name}</h2>
					{#if recipe.description}
						<p class="description">{recipe.description}</p>
					{/if}
					<div class="meta">
						{#if recipe.totalTime}<span>{formatMinutes(recipe.totalTime)}</span>{/if}
						{#if recipe.servings}<span>{recipe.servings} servings</span>{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<nav class="pagination">
			<button disabled={currentPage <= 1} onclick={() => goToPage(currentPage - 1)}>Previous</button>
			<span>Page {currentPage} of {totalPages}</span>
			<button disabled={currentPage >= totalPages} onclick={() => goToPage(currentPage + 1)}>Next</button>
		</nav>
	{/if}
{/if}

<style>
	@import '@mixins';

	.breadcrumb {
		display: flex;
		gap: 0.4em;
		font-size: 0.9em;
		margin-bottom: 1em;

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

	.count {
		font-size: 0.85em;
		color: var(--grey);
		margin: 0 0 1em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5em;
	}

	.card {
		border: 1px solid var(--grey_light);
		border-radius: 0.5em;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.2s;

		&:hover {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		& img {
			width: 100%;
			height: 180px;
			object-fit: cover;
			display: block;
		}

		& .no-image {
			width: 100%;
			height: 180px;
			background: color-mix(in srgb, var(--purple_bright) 8%, transparent);
		}
	}

	.info {
		padding: 0.8em;

		& h2 {
			font-size: 1em;
			margin: 0 0 0.3em;
			line-height: 1.3;
		}
	}

	.description {
		font-size: 0.85em;
		color: var(--grey);
		margin: 0 0 0.5em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta {
		display: flex;
		gap: 1em;
		font-size: 0.8em;
		color: var(--grey);
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1em;
		margin-top: 2em;
		padding: 1em 0;

		& button {
			padding: 0.5em 1em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: transparent;
			cursor: pointer;

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}

		& span {
			font-size: 0.9em;
			color: var(--grey);
		}
	}
</style>
