<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { MEAL_PLANNING_DND_TYPE, MEAL_PLANNING_FLIP_MS, type PaletteDndItem, type PlanningRecipe } from '$utils/mealPlanningDnd';
	import { formatMinutes } from '$utils/formatMinutes';

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

<section class="palette {className}" aria-label="{season} recipes">
	<h2>{season} recipes</h2>

	{#if loading}
		<p class="hint">Loading recipes...</p>
	{:else if recipes.length === 0}
		<p class="hint">No recipes tagged {season} yet.</p>
	{:else}
		<div
			class="cards"
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
				<div class="card" animate:flip={{ duration: MEAL_PLANNING_FLIP_MS }} aria-label={item.recipe.name}>
					{#if item.recipe.image}
						<img src={item.recipe.image} alt={item.recipe.name} loading="lazy" />
					{/if}
					<span class="name">{item.recipe.name}</span>
					{#if item.recipe.totalTime || item.recipe.servings}
						<span class="meta">
							{#if item.recipe.totalTime}{formatMinutes(item.recipe.totalTime)}{/if}
							{#if item.recipe.servings} · {item.recipe.servings} servings{/if}
						</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	@import '@mixins';

	.palette {
		margin-bottom: 1.5em;
		padding: 1em;
		background: color-mix(in srgb, var(--purple_bright) 4%, transparent);
		border-radius: 0.5em;
		border: 1px solid var(--grey_light);

		& h2 {
			font-size: 0.95em;
			margin: 0 0 0.8em;
		}
	}

	.hint {
		font-size: 0.85em;
		color: var(--grey);
		font-style: italic;
		margin: 0;
	}

	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		min-height: 60px;
	}

	.card {
		width: 140px;
		padding: 0.5em;
		background: white;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		cursor: grab;
		display: flex;
		flex-direction: column;

		& img {
			width: 100%;
			height: 60px;
			object-fit: cover;
			border-radius: 0.2em;
			margin-bottom: 0.3em;
		}
	}

	.name {
		font-size: 0.8em;
		font-weight: 600;
		line-height: 1.2;
	}

	.meta {
		display: block;
		font-size: 0.7em;
		color: var(--grey);
	}
</style>
