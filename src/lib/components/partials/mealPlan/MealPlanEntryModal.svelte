<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import Modal from '$parts/Modal.svelte';
	import Select from '$parts/Select.svelte';
	import fetchClientData from '$utils/fetchClientData';

	const ENTRY_TYPE_OPTIONS = [
		{ value: `breakfast`, label: `Breakfast` },
		{ value: `lunch`, label: `Lunch` },
		{ value: `dinner`, label: `Dinner` },
		{ value: `side`, label: `Side` },
	];

	const RECIPE_MIN_CHARS = 2;
	const RECIPE_DEBOUNCE_MS = 250;
	const RECIPE_FETCH_COUNT = 8;

	let {
		open = $bindable(false),
		mode,
		date,
		entryType = $bindable(`dinner`),
		linkMode = $bindable(`recipe`),
		title = $bindable(``),
		text = $bindable(``),
		recipeId = $bindable(null),
		recipeName = $bindable(``),
		saving = false,
		error = ``,
		onSave,
		onDelete,
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		date: string;
		entryType?: string;
		linkMode?: `recipe` | `custom`;
		title?: string;
		text?: string;
		recipeId?: string | null;
		recipeName?: string;
		saving?: boolean;
		error?: string;
		onSave: () => void;
		onDelete?: () => void;
	} = $props();

	let dateLabel = $derived.by(() => {
		try {
			return format(parseISO(date), `EEEE, d MMM`);
		}
		catch {
			return date;
		}
	});

	let modalTitle = $derived(mode === `create` ? `Add meal` : `Edit meal`);

	let valid = $derived(linkMode === `recipe` ? !!recipeId : title.trim().length > 0);

	function escapeGqlString(value: string): string {
		return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
	}

	let searchQuery = $state(``);
	let searchResults = $state<{ id: string; name: string; slug: string }[]>([]);
	let searching = $state(false);
	let searchToken = 0;
	let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	async function searchRecipes(searchTerm: string, token: number) {
		searching = true;
		const res = await fetchClientData({
			gqlQuery: `
				query {
					recipes(page: 1, perPage: ${RECIPE_FETCH_COUNT}, queryFilter: "${escapeGqlString(searchTerm)}") {
						items { id name slug }
					}
				}
			`,
		});
		if (token !== searchToken) return; // a newer search superseded this one
		searchResults = res.recipes?.items ?? [];
		searching = false;
	}

	$effect(() => {
		const term = searchQuery.trim();
		clearTimeout(searchDebounceTimer);
		searchToken += 1;
		if (linkMode !== `recipe` || term.length < RECIPE_MIN_CHARS) {
			searchResults = [];
			searching = false;
			return;
		}
		const token = searchToken;
		searchDebounceTimer = setTimeout(() => searchRecipes(term, token), RECIPE_DEBOUNCE_MS);
		return () => clearTimeout(searchDebounceTimer);
	});

	$effect(() => {
		if (open) {
			searchQuery = ``;
			searchResults = [];
		}
	});

	function selectRecipe(recipe: { id: string; name: string }) {
		recipeId = recipe.id;
		recipeName = recipe.name;
		searchQuery = ``;
		searchResults = [];
	}

	function clearRecipe() {
		recipeId = null;
		recipeName = ``;
	}
</script>

<Modal bind:open title={modalTitle}>
	<p class="date_label">{dateLabel}</p>

	<div class="field">
		Meal type
		<Select id="meal-entry-type" label="Meal type" bind:value={entryType} options={ENTRY_TYPE_OPTIONS} />
	</div>

	<fieldset>
		<legend class="sr-only">Link this meal to</legend>
		<label>
			<input type="radio" bind:group={linkMode} value="recipe" />
			Recipe
		</label>
		<label>
			<input type="radio" bind:group={linkMode} value="custom" />
			Custom
		</label>
	</fieldset>

	{#if linkMode === `recipe`}
		{#if recipeId}
			<div class="selected_recipe">
				<span class="name">{recipeName}</span>
				<button type="button" class="change" onclick={clearRecipe}>Change</button>
			</div>
		{:else}
			<div class="field">
				<input
					type="text"
					placeholder="Search recipes..."
					bind:value={searchQuery}
					aria-label="Search recipes"
				/>
				{#if searchQuery.trim().length >= RECIPE_MIN_CHARS}
					<ul class="results">
						{#each searchResults as recipe (recipe.id)}
							<li>
								<button type="button" onclick={() => selectRecipe(recipe)}>{recipe.name}</button>
							</li>
						{/each}
						{#if searching && searchResults.length === 0}
							<li class="hint">Searching...</li>
						{/if}
						{#if !searching && searchResults.length === 0}
							<li class="hint">No matching recipes</li>
						{/if}
					</ul>
				{/if}
			</div>
		{/if}
	{:else}
		<label class="field">
			Title
			<input type="text" bind:value={title} placeholder="e.g. Leftovers" />
		</label>
		<label class="field">
			Notes
			<textarea bind:value={text} rows="3"></textarea>
		</label>
	{/if}

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<button onclick={onSave} disabled={!valid || saving}>
			{saving ? `Saving…` : mode === `create` ? `Add` : `Save`}
		</button>
		<button onclick={() => (open = false)} disabled={saving}>Cancel</button>
		{#if mode === `edit` && onDelete}
			<button class="delete" onclick={onDelete} disabled={saving}>Delete</button>
		{/if}
	</div>
</Modal>

<style>
	@import '@mixins';

	.date_label {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.9em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;
	}

	fieldset {
		display: flex;
		gap: 1em;
		border: none;
		padding: 0;
		margin: 0 0 1em;
	}

	.selected_recipe {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0.5em 0.75em;
		margin-bottom: 1em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;

		& .name {
			font-weight: 600;
		}

		& .change {
			background: none;
			border: none;
			color: var(--purple_bright);
			cursor: pointer;
			padding: 0;
		}
	}

	.results {
		margin: 0.3em 0 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		max-height: 200px;
		overflow-y: auto;

		& li {
			margin: 0;
		}

		& button {
			width: 100%;
			text-align: left;
			padding: 0.5em 0.75em;
			border: none;
			background: none;
			cursor: pointer;

			&:hover {
				background: color-mix(in srgb, var(--purple_bright) 8%, transparent);
			}
		}

		& .hint {
			padding: 0.5em 0.75em;
			color: var(--grey);
			font-style: italic;
		}
	}

	.error {
		color: var(--red);
	}

	.actions {
		display: flex;
		gap: 0.5em;
	}

	.delete {
		margin-left: auto;
		color: var(--red);
	}
</style>
