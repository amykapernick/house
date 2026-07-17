<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import RecipeCard from '$components/parts/recipes/RecipeCard.svelte';
	import Pagination from '$components/parts/Pagination.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import { getPageTitle } from '$utils/pageTitle';

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
	<title>{getPageTitle(`${tagName || 'Tag'} Recipes`)}</title>
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
	<Skeleton rows={3} />
{:else if recipes.length === 0}
	<EmptyState title="No recipes found with this tag" />
{:else}
	<p class="count">{total} recipes</p>

	<div class="grid">
		{#each recipes as recipe (recipe.slug)}
			<RecipeCard {recipe} />
		{/each}
	</div>

	<Pagination {currentPage} {totalPages} onPageChange={goToPage} />
{/if}

<style>
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
</style>
