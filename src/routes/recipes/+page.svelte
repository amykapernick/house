<script lang="ts">
	import { onMount } from 'svelte';
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
	let allTags = $state<any[]>([]);
	let selectedTags = $state<string[]>([]);
	let loading = $state(true);
	let tagsLoading = $state(true);
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let search = $state('');
	let searchInput = $state('');
	let orderBy = $state('dateAdded');
	let orderDirection = $state('desc');
	let tagSearch = $state('');
	let showAllTags = $state(false);
	const perPage = 24;

	let filteredCloudTags = $derived(() => {
		let tags = allTags;
		if (tagSearch) {
			tags = tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));
		}
		if (!showAllTags && !tagSearch) {
			return tags.slice(0, 40);
		}
		return tags;
	});

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
		fetchClientData({
			cacheKey: 'recipe-tags',
			gqlQuery: `
				query {
					recipeTags { name slug }
				}
			`,
		}).then((res) => {
			allTags = (res.recipeTags ?? []).sort((a: any, b: any) =>
				a.name.localeCompare(b.name)
			);
			tagsLoading = false;
		});
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
</script>

<svelte:head>
	<title>Recipes | Kapers Crewe Household</title>
</svelte:head>

<h1>Recipes</h1>

<nav class="sub-nav">
	<a href={resolve('/recipes/tags')}>All tags</a>
	<a href={resolve('/meal-plan')}>Meal plan</a>
</nav>

{#if !tagsLoading}
	<section class="tag-cloud">
		<div class="tag-cloud-header">
			<h2>Filter by tags</h2>
			{#if selectedTags.length}
				<button class="clear-tags" onclick={clearTags}>Clear filters</button>
			{/if}
			<input
				type="text"
				class="tag-filter"
				placeholder="Find a tag..."
				bind:value={tagSearch}
			/>
		</div>

		<div class="tag-list">
			{#each filteredCloudTags() as tag (tag.slug)}
				<div class="tag-pill" class:selected={selectedTags.includes(tag.slug)}>
					<input
						type="checkbox"
						id="tag-{tag.slug}"
						checked={selectedTags.includes(tag.slug)}
						onchange={() => toggleTag(tag.slug)}
					/>
					<label for="tag-{tag.slug}">{tag.name}</label>
				</div>
			{/each}
		</div>

		{#if !tagSearch && !showAllTags && allTags.length > 40}
			<button class="show-more" onclick={() => showAllTags = true}>
				Show all {allTags.length} tags
			</button>
		{:else if showAllTags && !tagSearch}
			<button class="show-more" onclick={() => showAllTags = false}>
				Show fewer
			</button>
		{/if}
	</section>
{/if}

<div class="controls">
	<form class="search" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
		<input
			type="text"
			placeholder="Search recipes..."
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
	<p>Loading...</p>
{:else if recipes.length === 0}
	<p>No recipes found.</p>
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
					{#if recipe.tags?.length}
						<ul class="card-tags">
							{#each recipe.tags as tag (tag.slug)}
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
					{/if}
				</div>
			</a>
		{/each}
	</div>

	{#if totalPages > 1}
		<nav class="pagination">
			<button disabled={page <= 1} onclick={() => goToPage(page - 1)}>Previous</button>
			<span>Page {page} of {totalPages}</span>
			<button disabled={page >= totalPages} onclick={() => goToPage(page + 1)}>Next</button>
		</nav>
	{/if}
{/if}

<style>
	@import '@mixins';

	.sub-nav {
		display: flex;
		gap: 1em;
		margin-bottom: 1.5em;

		& a {
			color: var(--purple_bright);
			text-decoration: none;
			font-size: 0.9em;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.tag-cloud {
		margin-bottom: 1.5em;
		padding: 1em;
		background: color-mix(in srgb, var(--blue) 4%, transparent);
		border-radius: 0.5em;
		border: 1px solid var(--grey_light);
	}

	.tag-cloud-header {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 0.8em;

		& h2 {
			font-size: 0.95em;
			margin: 0;
		}
	}

	.tag-filter {
		margin-left: auto;
		padding: 0.3em 0.5em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		font-size: 0.85em;
		width: 180px;
	}

	.clear-tags {
		padding: 0.3em 0.7em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		background: transparent;
		color: var(--grey);
		cursor: pointer;
		font-size: 0.8em;

		&:hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em;
	}

	.tag-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		padding: 0.2em 0.6em;
		border: 1px solid var(--grey_light);
		border-radius: 1em;
		background: white;
		font-size: 0.8em;
		color: var(--navy);
		transition: all 0.15s;

		& input[type="checkbox"] {
			width: 0.85em;
			height: 0.85em;
			margin: 0;
			accent-color: var(--purple_bright);
			cursor: pointer;
		}

		& label {
			cursor: pointer;
		}

		&:hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}

		&.selected {
			background: var(--purple_bright);
			color: white;
			border-color: var(--purple_bright);

			& input[type="checkbox"] {
				accent-color: white;
			}
		}
	}

	.show-more {
		display: block;
		margin-top: 0.5em;
		padding: 0;
		border: none;
		background: none;
		color: var(--purple_bright);
		cursor: pointer;
		font-size: 0.8em;

		&:hover {
			text-decoration: underline;
		}
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1em;
		margin-bottom: 1.5em;
	}

	.search {
		display: flex;
		gap: 0.5em;

		& input {
			flex: 1;
			padding: 0.5em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 1em;
		}

		& button {
			padding: 0.5em 1em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: var(--purple_bright);
			color: white;
			cursor: pointer;

			&.clear {
				background: transparent;
				color: var(--grey);
			}
		}
	}

	.sort {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex-wrap: wrap;

		& span {
			font-size: 0.85em;
			color: var(--grey);
		}

		& button {
			padding: 0.3em 0.7em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: transparent;
			cursor: pointer;
			font-size: 0.85em;

			&.active {
				background: var(--purple_bright);
				color: white;
				border-color: var(--purple_bright);
			}
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
		margin-bottom: 0.5em;
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
		border: 1px solid currentColor;
		border-radius: 0.2em;
		font-size: 0.7em;
		color: var(--blue);
		background: transparent;
		cursor: pointer;

		&:hover {
			color: var(--purple_bright);
		}

		&.selected {
			background: var(--purple_bright);
			color: white;
			border-color: var(--purple_bright);
		}
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
