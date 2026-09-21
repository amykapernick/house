<script lang="ts">
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import fetchClientData, { clearAllCache } from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { importRecipeMutation, addRecipeToMealPlanMutation, addRecipeToShoppingListMutation, visibleRecipeTags } from '$utils/recipes';
	import RecipeCard from '$components/parts/recipes/RecipeCard/index.svelte';
	import Pagination from '$components/parts/Pagination/index.svelte';
	import SegmentedToggle from '$parts/SegmentedToggle/index.svelte';
	import TagCloud from '$components/parts/recipes/TagCloud/index.svelte';
	import Skeleton from '$components/parts/Skeleton/index.svelte';
	import EmptyState from '$components/parts/EmptyState/index.svelte';
	import ImportRecipeModal from '$components/parts/recipes/ImportRecipeModal/index.svelte';
	import AddToMealPlanModal from '$components/parts/recipes/AddToMealPlanModal/index.svelte';
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
	// Caps tags shown per card to roughly 2 rows at card width - a plain count
	// rather than a CSS height clamp, since pill width varies too much with
	// tag-name length for a height clamp to reliably avoid cutting one off.
	const CARD_TAG_LIMIT = 6;

	// Persists filter/search/sort state across browser back/forward navigation
	// (eg. landing back here after opening a recipe) - this page keeps that
	// state in local $state rather than the URL, so without this a back
	// navigation would otherwise reset to an unfiltered, unsorted first page.
	export const snapshot = {
		capture: () => ({ page, search, searchInput, selectedTags, orderBy, orderDirection }),
		restore: (value: { page: number; search: string; searchInput: string; selectedTags: string[]; orderBy: string; orderDirection: string }) => {
			page = value.page;
			search = value.search;
			searchInput = value.searchInput;
			selectedTags = value.selectedTags;
			orderBy = value.orderBy;
			orderDirection = value.orderDirection;
		},
	};

	function buildQuery() {
		let args = `page: ${page}, perPage: ${perPage}, orderBy: "${orderBy}", orderDirection: "${orderDirection}"`;
		if (orderBy === 'totalTime') args += `, orderByNullPosition: "last"`;
		if (search) args += `, queryFilter: "${search}"`;
		if (selectedTags.length) {
			const tagList = selectedTags.map((t) => `"${t}"`).join(', ');
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

		function applyRecipes(res: any) {
			const data = res.recipes;
			recipes = data?.items ?? [];
			totalPages = data?.totalPages ?? 1;
			total = data?.total ?? 0;
			loading = false;
		}

		fetchClientData({
			cacheKey: `recipes-list-${page}-${search}-${orderBy}-${orderDirection}-${selectedTags.join(',')}`,
			onStale: applyRecipes,
			gqlQuery: buildQuery(),
		}).then(applyRecipes);
	}

	function fetchTags() {
		function handleTags(res: any) {
			allTags = visibleRecipeTags(res.recipeTags).sort((a: any, b: any) => a.name.localeCompare(b.name));
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
			selectedTags = selectedTags.filter((t) => t !== slug);
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

	function handleSortFieldChange() {
		orderDirection = orderBy === 'name' ? 'asc' : 'desc';
		page = 1;
		fetchRecipes();
	}

	function toggleSortDirection() {
		orderDirection = orderDirection === 'desc' ? 'asc' : 'desc';
		page = 1;
		fetchRecipes();
	}

	// A radio's `change` event only fires when the value actually flips, so
	// re-clicking the already-active sort field needs its own hook (see
	// SegmentedToggle's onOptionClick) - `field` here still reflects the value
	// from before this click, since the click event fires before the radio's
	// own activation behaviour updates it.
	function handleSortOptionClick(field: string) {
		if (field === orderBy) toggleSortDirection();
	}

	function tagName(slug: string) {
		return allTags.find((t) => t.slug === slug)?.name ?? slug;
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

	// Quick-add from a recipe card - meal plan needs a date/meal type first, so
	// it opens a small modal; shopping list has nothing to choose, so it's a
	// single mutation straight from the card's button.
	let mealPlanModalOpen = $state(false);
	let mealPlanRecipe = $state<{ id: string; name: string } | null>(null);
	let mealPlanDate = $state('');
	let mealPlanEntryType = $state('dinner');
	let mealPlanSaving = $state(false);
	let mealPlanError = $state('');
	let shoppingListMessage = $state('');
	let shoppingListMessageTimeout: ReturnType<typeof setTimeout> | undefined;

	function openMealPlanModal(recipe: any) {
		mealPlanRecipe = { id: recipe.id, name: recipe.name };
		mealPlanDate = format(new Date(), DATE_FORMATS.iso);
		mealPlanEntryType = 'dinner';
		mealPlanError = '';
		mealPlanModalOpen = true;
	}

	async function handleAddToMealPlan() {
		if (!mealPlanRecipe || !mealPlanDate) return;
		mealPlanSaving = true;
		mealPlanError = '';

		const res = await fetchClientData({
			gqlQuery: addRecipeToMealPlanMutation(mealPlanRecipe.id, mealPlanDate, mealPlanEntryType),
		});
		mealPlanSaving = false;

		if (!res?.createMealPlanEntry?.id) {
			mealPlanError = 'Failed to add to meal plan.';
			return;
		}

		// The meal plan page caches its GraphQL responses per date-range/week -
		// this add happens from an unrelated page with no way to know which of
		// those keys the new entry falls into, so drop every cache entry rather
		// than risk the meal plan page showing stale data missing it.
		clearAllCache();
		mealPlanModalOpen = false;
	}

	async function handleAddToShoppingList(recipe: any) {
		clearTimeout(shoppingListMessageTimeout);
		const res = await fetchClientData({ gqlQuery: addRecipeToShoppingListMutation(recipe.id) });
		shoppingListMessage = res?.addRecipesToShoppingList?.success ? `Added "${recipe.name}" to the shopping list.` : `Failed to add "${recipe.name}" to the shopping list.`;
		shoppingListMessageTimeout = setTimeout(() => (shoppingListMessage = ''), 4000);
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Recipes`)}</title>
</svelte:head>

<Title>
	Recipes
	{#snippet actions()}
		<button
			type="button"
			class="import"
			onclick={openImportModal}>Import from URL</button
		>
	{/snippet}
</Title>

<ImportRecipeModal
	bind:open={importModalOpen}
	bind:url={importUrl}
	saving={importSaving}
	error={importError}
	onImport={handleImport}
/>

{#if mealPlanRecipe}
	<AddToMealPlanModal
		bind:open={mealPlanModalOpen}
		recipeName={mealPlanRecipe.name}
		bind:date={mealPlanDate}
		bind:entryType={mealPlanEntryType}
		saving={mealPlanSaving}
		error={mealPlanError}
		onSave={handleAddToMealPlan}
	/>
{/if}

{#if shoppingListMessage}<p class="shopping-list-message">{shoppingListMessage}</p>{/if}

{#if !tagsLoading}
	<TagCloud
		tags={allTags}
		{selectedTags}
		onToggle={toggleTag}
		onClear={clearTags}
	/>
{/if}

<div class="controls">
	<form
		class="search"
		onsubmit={(e) => {
			e.preventDefault();
			handleSearch();
		}}
	>
		<input
			type="text"
			placeholder="Search recipes..."
			aria-label="Search recipes"
			bind:value={searchInput}
		/>
		<button type="submit">Search</button>
		{#if search}
			<button
				type="button"
				class="clear"
				onclick={clearSearch}>Clear</button
			>
		{/if}
	</form>

	<div class="sort">
		<span>Sort by:</span>
		<SegmentedToggle
			legend="Sort by"
			name="recipe-sort"
			bind:value={orderBy}
			onchange={handleSortFieldChange}
			onOptionClick={handleSortOptionClick}
			options={[
				{ value: 'dateAdded', label: 'Date added' },
				{ value: 'name', label: 'Name' },
				{ value: 'rating', label: 'Rating' },
				{ value: 'lastMade', label: 'Last made' },
				{ value: 'totalTime', label: 'Time' },
			]}
		>
			{#snippet optionSuffix({ active })}
				<span
					class="direction"
					class:hidden={!active}
					aria-hidden="true">{orderDirection === 'desc' ? ' ↓' : ' ↑'}</span
				>
			{/snippet}
		</SegmentedToggle>
		<span class="sr-only">Sort direction: {orderDirection === 'desc' ? 'descending' : 'ascending'} - click the active sort option again to flip it</span>
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
			<RecipeCard
				{recipe}
				showActions
				onAddToMealPlan={openMealPlanModal}
				onAddToShoppingList={handleAddToShoppingList}
			>
				{#snippet tags(recipeTags)}
					{@const visibleTags = visibleRecipeTags(recipeTags).slice(0, CARD_TAG_LIMIT)}
					{#if visibleTags.length}
						<ul class="card-tags">
							{#each visibleTags as tag (tag.slug)}
								<li>
									<button
										class="card-tag"
										class:selected={selectedTags.includes(tag.slug)}
										onclick={() => toggleTag(tag.slug)}
									>
										{tag.name}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				{/snippet}
			</RecipeCard>
		{/each}
	</div>

	<Pagination
		currentPage={page}
		{totalPages}
		onPageChange={goToPage}
	/>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	@import '@mixins';

	.import {

		@include button_secondary;
	}

	.shopping-list-message {
		margin: 0 0 1.5em;
		color: var(--text_secondary);
		font-size: 0.85em;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-bottom: 1.5em;
		padding: 0;
		font-size: 1em;
	}

	.search {
		display: grid;
		grid-template-columns: 1fr auto auto;
		padding: 0;
		gap: 0.5em;

		& input {
			grid-column: 1 / 3;
			grid-row: 1;
			height: 100%;
			margin: 0;
			padding: 0.6em 1em;
			padding-right: 5em;
			border: 1px solid var(--input_border);
			border-radius: 0.6em;
			background: var(--input_bg);
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
		& .direction.hidden {
			visibility: hidden;
		}
	}

	.count {
		margin: 0 0 1em;
		color: var(--text_secondary);
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
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 0.3em;
	}

	.card-tag {
		padding: 0.2em 0.6em;
		transition: all 0.15s;
		border: 1px solid var(--blue);
		border-radius: 1em;
		background: var(--blue_tint_bg);
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
