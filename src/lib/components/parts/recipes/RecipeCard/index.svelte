<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';
	import MealPlanIcon from '$img/icons/diet-plan-1.svg?component';
	import ShoppingListIcon from '$img/icons/receipt-list-42-2.svg?component';
	import styles from './index.module.css';

	type RecipeSummary = {
		id: string;
		slug: string;
		name: string;
		image?: string | null;
		description?: string | null;
		totalTime?: number | string | null;
		servings?: number | null;
		rating?: number | null;
		tags?: { name: string; slug: string }[] | null;
	};

	let {
		recipe,
		size = `default`,
		dayLabel,
		tags,
		showActions = false,
		onAddToMealPlan,
		onAddToShoppingList,
	}: {
		recipe: RecipeSummary;
		/** `compact` is used for the dashboard's smaller widget grid - shorter image, smaller type, h3 instead of h2. */
		size?: `default` | `compact`;
		dayLabel?: string;
		tags?: Snippet<[{ name: string; slug: string }[]]>;
		/** Quick-add actions - only shown on the browsable /recipes list, not the dashboard or meal plan. */
		showActions?: boolean;
		onAddToMealPlan?: (recipe: RecipeSummary) => void;
		onAddToShoppingList?: (recipe: RecipeSummary) => void;
	} = $props();

	function ratingStars(rating: number): string {
		const filled = Math.round(rating);
		return `${`★`.repeat(filled)}${`☆`.repeat(5 - filled)}`;
	}
</script>

<article class={[styles.card, size === `compact` && styles.compact]}>
	<div class={[styles.media, size === `compact` && styles.compact]}>
		{#if recipe.image}
			<img
				src={recipe.image}
				alt={recipe.name}
				loading="lazy"
			/>
		{:else}
			<div class={styles['no-image']}></div>
		{/if}
		{#if showActions}
			<div class={styles.actions}>
				<button
					type="button"
					onclick={() => onAddToMealPlan?.(recipe)}
				>
					<MealPlanIcon />
					<span class="sr-only">Add to meal plan</span>
				</button>
				<button
					type="button"
					onclick={() => onAddToShoppingList?.(recipe)}
				>
					<ShoppingListIcon />
					<span class="sr-only">Add to shopping list</span>
				</button>
			</div>
		{/if}
	</div>
	<div class={[styles.info, size === `compact` && styles.compact]}>
		{#if dayLabel}
			<span class={styles.day}>{dayLabel}</span>
		{/if}
		{#if size === `compact`}
			<h3><a class={styles['title-link']} href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}>{recipe.name}</a></h3>
		{:else}
			<h2><a class={styles['title-link']} href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}>{recipe.name}</a></h2>
		{/if}
		{#if recipe.description}
			<p class={[styles.description, size === `compact` && styles.compact]}>
				{recipe.description}
			</p>
		{/if}
		<div class={[styles.meta, size === `compact` && styles.compact]}>
			{#if recipe.rating}
				<span
					class={styles.rating}
					aria-label={`Rated ${recipe.rating} out of 5`}>{ratingStars(recipe.rating)}</span
				>
			{/if}
			{#if recipe.totalTime}<span>{formatMinutes(recipe.totalTime)}</span>{/if}
			{#if recipe.servings}<span>{recipe.servings} servings</span>{/if}
		</div>
		<div class={[styles.tags]}>
			{#if recipe.tags?.length && tags}
				{@render tags(recipe.tags)}
			{/if}
		</div>
	</div>
</article>
