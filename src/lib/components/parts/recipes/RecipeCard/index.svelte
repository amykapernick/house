<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';
	import styles from './index.module.css';

	type RecipeSummary = {
		slug: string;
		name: string;
		image?: string | null;
		description?: string | null;
		totalTime?: number | string | null;
		servings?: number | null;
		tags?: { name: string; slug: string }[] | null;
	};

	let {
		recipe,
		size = `default`,
		dayLabel,
		tags,
	}: {
		recipe: RecipeSummary;
		/** `compact` is used for the dashboard's smaller widget grid - shorter image, smaller type, h3 instead of h2. */
		size?: `default` | `compact`;
		dayLabel?: string;
		tags?: Snippet<[{ name: string; slug: string }[]]>;
	} = $props();
</script>

<a
	class={[styles.card, size === `compact` && styles.compact]}
	href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}
>
	{#if recipe.image}
		<img
			src={recipe.image}
			alt={recipe.name}
			loading="lazy"
		/>
	{:else}
		<div class={styles['no-image']}></div>
	{/if}
	<div
		class={[styles.info, size === `compact` && styles.compact]}
	>
		{#if dayLabel}
			<span class={styles.day}>{dayLabel}</span>
		{/if}
		{#if size === `compact`}
			<h3>{recipe.name}</h3>
		{:else}
			<h2>{recipe.name}</h2>
		{/if}
		{#if recipe.description}
			<p
				class={[styles.description, size === `compact` && styles.compact]}
			>
				{recipe.description}
			</p>
		{/if}
		<div
			class={[styles.meta, size === `compact` && styles.compact]}
		>
			{#if recipe.totalTime}<span>{formatMinutes(recipe.totalTime)}</span>{/if}
			{#if recipe.servings}<span>{recipe.servings} servings</span>{/if}
		</div>
		{#if recipe.tags?.length && tags}
			{@render tags(recipe.tags)}
		{/if}
	</div>
</a>
