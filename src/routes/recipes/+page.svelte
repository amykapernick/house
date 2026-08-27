<script lang="ts">
	import { onMount } from 'svelte';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { importRecipeMutation } from '$utils/recipes';
	import RecipeCard from '$components/parts/recipes/RecipeCard/index.svelte';
	import Pagination from '$components/parts/Pagination/index.svelte';
	import TagCloud from '$components/parts/recipes/TagCloud/index.svelte';
	import Skeleton from '$components/parts/Skeleton/index.svelte';
	import EmptyState from '$components/parts/EmptyState/index.svelte';
	import ImportRecipeModal from '$components/parts/recipes/ImportRecipeModal/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';

	let recipes = $state<any[]>([]);
	let allTags = $state<any[]>([]);
	let selectedTags = $state<string[]>([]);
	let loading = $state(true);
	let tagsLoading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let search = $state('');
	let searchInput = $state('');
	let orderBy = $state('lastMade');
	let orderDirection = $state('desc');
	const perPage = 24;

	function buildQuery() {
		let args = `page: ${page}, perPage: ${perPage}, orderBy: "${orderBy}", orderDirection: "${orderDirection}"`;
		if (orderBy === 'totalTime') args += `, orderByNullPosition: "last"`;
		if (search) args += `, queryFilter: "${search}"`;
		if (selectedTags.length) {
			const tagList = selectedTags.map(t => `"${t}"`).join(', ');
			args += `, tags: [${tagList}]`;
		}

		return `
			query {
				recipes(${args}) {
					page
					perPage
					total
					totalPages
					items {
						id name slug image description
						totalTime prepTime cookTime
						servings rating
						tags { name slug }
						categories { name slug }
					}
				}
			}
		`;
	}

	function fetchRecipes() {
		loading = true;
		fetchClientData({
			gqlQuery: buildQuery(),
		}).then((res) => {
			const data = res.recipes;
			recipes = data?.items ?? [];
			totalPages = data?.totalPages ?? 1;
			total = data?.total ?? 0;
			loading = false;
		});
	}

	function fetchTags() {
		function handleTags(res: any) {
			allTags = (res.recipeTags ?? []).sort((a: any, b: any) =>
				a.name.localeCompare(b.name)
			);
			tagsLoading = false;
		}
		fetchClientData({
			cacheKey: 'recipe-tags',
			onStale: handleTags,
			gqlQuery: `
				query {
					recipeTags { name slug }
				}
			`,
		}).then(handleTags);
	}

	onMount(() => {
		fetchRecipes();
		fetchTags();
	});

	function toggleTag(slug: string) {
		if (selectedTags.includes(slug)) {
			selectedTags = selectedTags.filter(t => t !== slug);
		} else {
			selectedTags = [...selectedTags, slug];
		}
		page = 1;
		fetchRecipes();
	}

	function clearTags() {
		selectedTags = [];
		page = 1;
		fetchRecipes();
	}

	function handleSearch() {
		search = searchInput;
		page = 1;
		fetchRecipes();
	}

	function clearSearch() {
		search = '';
		searchInput = '';
		page = 1;
		fetchRecipes();
	}

	function goToPage(p: number) {
		page = p;
		fetchRecipes();
	}

	function handleSort(field: string) {
		if (orderBy === field) {
			orderDirection = orderDirection === 'desc' ? 'asc' : 'desc';
		} else {
			orderBy = field;
			orderDirection = field === 'name' ? 'asc' : 'desc';
		}
		page = 1;
		fetchRecipes();
	}

	function tagName(slug: string) {
		return allTags.find(t => t.slug === slug)?.name ?? slug;
	}

	// Import from URL - Mealie scrapes the page and creates the recipe; we then
	// jump straight to its detail page rather than refreshing this list.
	let importModalOpen = $state(false);
	let importUrl = $state('');
	let importSaving = $state(false);
	let importError = $state('');

	function openImportModal() {
		importUrl = '';
		importError = '';
		importModalOpen = true;
	}

	async function handleImport() {
		importSaving = true;
		importError = '';

		const res = await fetchClientData({ gqlQuery: importRecipeMutation(importUrl.trim()) });
		importSaving = false;

		const slug = res?.importRecipe?.slug;
		if (!slug) {
			importError = 'Failed to import recipe - check the URL and try again.';
			return;
		}

		importModalOpen = false;
		goto(resolve(`/recipes/[slug]`, { slug }));
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Recipes`)}</title>
</svelte:head>

<Title>Recipes</Title>

<button type="button" class="import" onclick={openImportModal}>Import from URL</button>

<ImportRecipeModal
	bind:open={importModalOpen}
	bind:url={importUrl}
	saving={importSaving}
	error={importError}
	onImport={handleImport}
/>

{#if !tagsLoading}
	<TagCloud tags={allTags} {selectedTags} onToggle={toggleTag} onClear={clearTags} />
{/if}

<div class="controls">
	<form class="search" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
		<input
			type="text"
			placeholder="Search recipes..."
			aria-label="Search recipes"
			bind:value={searchInput}
		/>
		<button type="submit">Search</button>
		{#if search}
			<button type="button" class="clear" onclick={clearSearch}>Clear</button>
		{/if}
	</form>

	<div class="sort">
		<span>Sort by:</span>
		<button class:active={orderBy === 'dateAdded'} onclick={() => handleSort('dateAdded')}>
			Date added {orderBy === 'dateAdded' ? (orderDirection === 'desc' ? '↓' : '↑') : ''}
		</button>
		<button class:active={orderBy === 'name'} onclick={() => handleSort('name')}>
			Name {orderBy === 'name' ? (orderDirection === 'desc' ? '↓' : '↑') : ''}
		</button>
		<button class:active={orderBy === 'rating'} onclick={() => handleSort('rating')}>
			Rating {orderBy === 'rating' ? (orderDirection === 'desc' ? '↓' : '↑') : ''}
		</button>
		<button class:active={orderBy === 'lastMade'} onclick={() => handleSort('lastMade')}>
			Last made {orderBy === 'lastMade' ? (orderDirection === 'desc' ? '↓' : '↑') : ''}
		</button>
		<button class:active={orderBy === 'totalTime'} onclick={() => handleSort('totalTime')}>
			Time {orderBy === 'totalTime' ? (orderDirection === 'desc' ? '↓' : '↑') : ''}
		</button>
	</div>
</div>

{#if loading}
	<Skeleton rows={3} />
{:else if recipes.length === 0}
	<EmptyState title="No recipes found" />
{:else}
	<p class="count">{total} recipes</p>

	<div class="grid">
		{#each recipes as recipe (recipe.slug)}
			<RecipeCard {recipe}>
				{#snippet tags(recipeTags)}
					<ul class="card-tags">
						{#each recipeTags as tag (tag.slug)}
							<li>
								<button
									class="card-tag"
									class:selected={selectedTags.includes(tag.slug)}
									onclick={(e) => { e.stopPropagation(); e.preventDefault(); toggleTag(tag.slug); }}
								>
									{tag.name}
								</button>
							</li>
						{/each}
					</ul>
				{/snippet}
			</RecipeCard>
		{/each}
	</div>

	<Pagination currentPage={page} {totalPages} onPageChange={goToPage} />
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	@import '@mixins';

	.import {

		@include button_secondary;

		margin-bottom: 1em;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-bottom: 1.5em;
	}

	.search {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.5em;

		& input {
			grid-column: 1 / 3;
			grid-row: 1;
			height: 100%;
			margin: 0;
			padding: 0.5em;
			padding-right: 5em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 1em;
		}

		& button {
			height: 100%;

			&.clear {

				@include button_secondary;
				
				grid-column-start: 2;
				grid-row-start: 1;
				height: auto;
				margin-right: 1em;
				font-size: 0.7em;
				place-self: center end;
			}
		}
	}

	.sort {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;

		& span {
			color: var(--grey);
			font-size: 0.85em;
		}

		& button {
			padding: 0.3em 0.7em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: var(--transparent);
			color: var(--black);
			font-size: 0.85em;
			cursor: pointer;

			&.active {
				border-color: var(--purple_bright);
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

	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card-tag {
		padding: 0.1em 0.4em;
		border: 1px solid var(--blue);
		border-radius: 0.2em;
		background: var(--blue);
		color: var(--blue_text);
		font-size: 0.7em;
		cursor: pointer;

		&:hover {
			border-color: var(--purple_bright);
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}

		&.selected {
			border-color: var(--purple_bright);
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}
	}
</style>
