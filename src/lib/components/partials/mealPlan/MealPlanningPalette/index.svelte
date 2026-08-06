<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { MEAL_PLANNING_DND_TYPE, MEAL_PLANNING_FLIP_MS, type PaletteDndItem, type PlanningRecipe } from '$utils/mealPlanningDnd';
	import { formatMinutes } from '$utils/formatMinutes';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import styles from './index.module.css';

	let { recipes, loading, season, class: className = '' }: { recipes: PlanningRecipe[]; loading: boolean; season: string; class?: string } = $props();

	function toPaletteItems(list: PlanningRecipe[]): PaletteDndItem[] {
		return list.map((recipe) => ({ id: recipe.id, kind: `palette` as const, recipe }));
	}

	let paletteItems = $derived(toPaletteItems(recipes));

	function handleConsider(e: CustomEvent<{ items: PaletteDndItem[] }>) {
		paletteItems = e.detail.items;
	}

	// The dropped copy is created (with a new id) by the destination day zone.
	// The palette itself is only ever a source, so on finalize it always
	// restores its full list - this is what makes dragging a "copy" rather
	// than a "move" that empties the palette.
	function handleFinalize() {
		paletteItems = toPaletteItems(recipes);
	}
</script>

<section
	class="{styles.palette} {className}"
	aria-label="{season} recipes"
>
	<h2>{season} recipes</h2>

	<!-- TODO: Add any recipes that are linked to things in the freezer -->
	{#if loading}
		<Skeleton rows={3} />
	{:else if recipes.length === 0}
		<EmptyState title="No recipes tagged {season} yet" />
	{:else}
		<div
			class={styles.cards}
			aria-label="{season} recipes"
			use:dndzone={{
				items: paletteItems,
				type: MEAL_PLANNING_DND_TYPE,
				flipDurationMs: MEAL_PLANNING_FLIP_MS,
				dropFromOthersDisabled: true,
				delayTouchStart: true,
			}}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each paletteItems as item (item.id)}
				<div
					class={styles.card}
					animate:flip={{ duration: MEAL_PLANNING_FLIP_MS }}
					aria-label={item.recipe.name}
				>
					{#if item.recipe.image}
						<img
							src={item.recipe.image}
							alt={item.recipe.name}
							loading="lazy"
						/>
					{/if}
					<span class={styles.name}>{item.recipe.name}</span>
					{#if item.recipe.totalTime || item.recipe.servings}
						<span class={styles.meta}>
							{#if item.recipe.totalTime}{formatMinutes(item.recipe.totalTime)}{/if}
							{#if item.recipe.servings}
								· {item.recipe.servings} servings{/if}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>
