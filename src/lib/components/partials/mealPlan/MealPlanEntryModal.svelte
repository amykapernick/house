<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import Modal from '$parts/Modal.svelte';
	import Select from '$parts/Select.svelte';
	import Autocomplete from '$parts/Autocomplete.svelte';
	import fetchClientData from '$utils/fetchClientData';

	type Recipe = { id: string; name: string; slug: string; categories: { name: string }[]; tags: { name: string }[] };

	const ENTRY_TYPE_OPTIONS = [
		{ value: `breakfast`, label: `Breakfast` },
		{ value: `lunch`, label: `Lunch` },
		{ value: `dinner`, label: `Dinner` },
		{ value: `side`, label: `Side` },
	];

	const RECIPE_MIN_CHARS = 2;
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
		class: className = '',
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
		class?: string;
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

	async function searchRecipes(searchTerm: string): Promise<Recipe[]> {
		const res = await fetchClientData({
			gqlQuery: `
				query {
					recipes(page: 1, perPage: ${RECIPE_FETCH_COUNT}, queryFilter: "${escapeGqlString(searchTerm)}") {
						items { id name slug categories { name } tags { name } }
					}
				}
			`,
		});
		return res.recipes?.items ?? [];
	}

	$effect(() => {
		if (open) searchQuery = ``;
	});

	function recipeBadge(recipe: Recipe): string | undefined {
		return recipe.categories[0]?.name ?? recipe.tags[0]?.name;
	}

	function selectRecipe(recipe: Recipe) {
		recipeId = recipe.id;
		recipeName = recipe.name;
		searchQuery = ``;
	}

	function clearRecipe() {
		recipeId = null;
		recipeName = ``;
	}
</script>

<Modal bind:open class={className} title={modalTitle}>
	<p class="date_label">{dateLabel}</p>

	<div class="field">
		Meal type
		<Select id="meal-entry-type" label="Meal type" bind:value={entryType} options={ENTRY_TYPE_OPTIONS} />
	</div>

	<fieldset>
		<legend class="sr-only">Link this meal to</legend>
		<div class="link_mode_option">
			<input type="radio" id="meal-entry-link-recipe" bind:group={linkMode} value="recipe" />
			<label for="meal-entry-link-recipe">Recipe</label>
		</div>
		<div class="link_mode_option">
			<input type="radio" id="meal-entry-link-custom" bind:group={linkMode} value="custom" />
			<label for="meal-entry-link-custom">Custom</label>
		</div>
	</fieldset>

	{#if linkMode === `recipe`}
		{#if recipeId}
			<div class="selected_recipe">
				<span class="name">{recipeName}</span>
				<button type="button" class="change" onclick={clearRecipe}>Change</button>
			</div>
		{:else}
			<div class="field">
				<Autocomplete
					id="meal-entry-recipe-search"
					label="Search recipes"
					hiddenLabel
					bind:value={searchQuery}
					placeholder="Search recipes..."
					minChars={RECIPE_MIN_CHARS}
					onSearch={searchRecipes}
					onSelect={selectRecipe}
					getKey={(recipe) => recipe.id}
					getLabel={(recipe) => recipe.name}
					getBadge={recipeBadge}
					noResultsText="No matching recipes"
				/>
			</div>
		{/if}
	{:else}
		<div class="field">
			<label for="meal-entry-title">Title</label>
			<input type="text" id="meal-entry-title" bind:value={title} placeholder="e.g. Leftovers" />
		</div>
		<div class="field">
			<label for="meal-entry-notes">Notes</label>
			<textarea id="meal-entry-notes" bind:value={text} rows="3"></textarea>
		</div>
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

	.link_mode_option {
		display: flex;
		align-items: center;
		gap: 0.3em;
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
