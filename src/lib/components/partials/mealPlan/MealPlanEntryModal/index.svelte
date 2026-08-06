<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import Autocomplete from '$parts/Autocomplete/index.svelte';
	import fetchClientData from '$utils/fetchClientData';
	import styles from './index.module.css';

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

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		...(mode === `edit` && onDelete ? [{ label: `Delete`, onclick: onDelete, style: `secondary`, variant: `danger`, disabled: saving } as ModalAction] : []),
		{ label: saving ? `Saving…` : mode === `create` ? `Add` : `Save`, onclick: onSave, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal bind:open class={className} title={modalTitle} actions={modalActions}>
	<p class={styles.date_label}>{dateLabel}</p>

	<div class={styles.field}>
		Meal type
		<Select id="meal-entry-type" label="Meal type" bind:value={entryType} options={ENTRY_TYPE_OPTIONS} />
	</div>

	<fieldset class={styles.link_mode_fieldset}>
		<legend class="sr-only">Link this meal to</legend>
		<div class={styles.link_mode_option}>
			<input type="radio" id="meal-entry-link-recipe" bind:group={linkMode} value="recipe" />
			<label for="meal-entry-link-recipe">Recipe</label>
		</div>
		<div class={styles.link_mode_option}>
			<input type="radio" id="meal-entry-link-custom" bind:group={linkMode} value="custom" />
			<label for="meal-entry-link-custom">Custom</label>
		</div>
	</fieldset>

	{#if linkMode === `recipe`}
		{#if recipeId}
			<div class={styles.selected_recipe}>
				<span class={styles.name}>{recipeName}</span>
				<button type="button" class={styles.change} onclick={clearRecipe}>Change</button>
			</div>
		{:else}
			<div class={styles.field}>
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
		<div class={styles.field}>
			<label for="meal-entry-title">Title</label>
			<input type="text" id="meal-entry-title" bind:value={title} placeholder="e.g. Leftovers" />
		</div>
		<div class={styles.field}>
			<label for="meal-entry-notes">Notes</label>
			<textarea id="meal-entry-notes" bind:value={text} rows="3"></textarea>
		</div>
	{/if}

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
