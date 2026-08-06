<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Autocomplete from '$parts/Autocomplete/index.svelte';
	import fetchClientData from '$utils/fetchClientData';
	import styles from './index.module.css';

	type Recipe = { id: string; name: string; slug: string };
	type RecipeLink = { name: string; slug: string | null };

	const RECIPE_MIN_CHARS = 2;
	const RECIPE_FETCH_COUNT = 8;

	let {
		open = $bindable(false),
		itemName,
		recipes = $bindable<RecipeLink[]>([]),
		saving = false,
		error = ``,
		onSave,
	}: {
		open?: boolean;
		itemName: string;
		recipes?: RecipeLink[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
	} = $props();

	function escapeGqlString(value: string): string {
		return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
	}

	let searchQuery = $state(``);

	async function searchRecipes(searchTerm: string): Promise<Recipe[]> {
		const res = await fetchClientData({
			gqlQuery: `
				query {
					recipes(page: 1, perPage: ${RECIPE_FETCH_COUNT}, queryFilter: "${escapeGqlString(searchTerm)}") {
						items { id name slug }
					}
				}
			`,
		});
		return res.recipes?.items ?? [];
	}

	$effect(() => {
		if (open) searchQuery = ``;
	});

	function addRecipe(recipe: Recipe) {
		if (recipes.some((r) => r.name.toLowerCase() === recipe.name.toLowerCase())) return;
		recipes = [...recipes, { name: recipe.name, slug: recipe.slug }];
		searchQuery = ``;
	}

	function removeRecipe(recipe: RecipeLink) {
		recipes = recipes.filter((r) => r !== recipe);
	}

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		{ label: saving ? `Saving…` : `Save`, onclick: onSave, variant: `success`, disabled: saving },
	]);
</script>

<Modal
	bind:open
	title={`Link recipes — ${itemName}`}
	actions={modalActions}
>
	{#if recipes.length}
		<ul class={styles['linked-recipes']}>
			{#each recipes as recipe (recipe.name)}
				<li>
					<span class={styles.name}>{recipe.name}</span>
					<button
						type="button"
						class={styles.remove}
						onclick={() => removeRecipe(recipe)}
						aria-label={`Remove ${recipe.name}`}>×</button
					>
				</li>
			{/each}
		</ul>
	{/if}

	<Autocomplete
		id="freezer-recipe-search"
		label="Search recipes"
		hiddenLabel
		bind:value={searchQuery}
		placeholder="Search recipes..."
		minChars={RECIPE_MIN_CHARS}
		onSearch={searchRecipes}
		onSelect={addRecipe}
		getKey={(recipe) => recipe.id}
		getLabel={(recipe) => recipe.name}
		noResultsText="No matching recipes"
	/>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
