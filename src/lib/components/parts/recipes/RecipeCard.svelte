<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';

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
	class="card"
	class:compact={size === `compact`}
	href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}
>
	{#if recipe.image}
		<img
			src={recipe.image}
			alt={recipe.name}
			loading="lazy"
		/>
	{:else}
		<div class="no-image"></div>
	{/if}
	<div
		class="info"
		class:compact={size === `compact`}
	>
		{#if dayLabel}
			<span class="day">{dayLabel}</span>
		{/if}
		{#if size === `compact`}
			<h3>{recipe.name}</h3>
		{:else}
			<h2>{recipe.name}</h2>
		{/if}
		{#if recipe.description}
			<p
				class="description"
				class:compact={size === `compact`}
			>
				{recipe.description}
			</p>
		{/if}
		<div
			class="meta"
			class:compact={size === `compact`}
		>
			{#if recipe.totalTime}<span>{formatMinutes(recipe.totalTime)}</span>{/if}
			{#if recipe.servings}<span>{recipe.servings} servings</span>{/if}
		</div>
		{#if recipe.tags?.length && tags}
			{@render tags(recipe.tags)}
		{/if}
	</div>
</a>

<style>
	.card {
		display: block;
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
			background: color-mix(in oklch, var(--purple_bright) 8%, var(--transparent));
		}

		&.compact {
			& img,
			& .no-image {
				height: 140px;
			}
		}
	}

	.info {
		padding: 0.8em;

		& h2 {
			font-size: 1em;
			margin: 0 0 0.3em;
			line-height: 1.3;
		}

		&.compact {
			padding: 0.6em;

			& h3 {
				font-size: 0.9em;
				margin: 0 0 0.2em;
				line-height: 1.3;
			}
		}
	}

	.day {
		display: block;
		font-size: 0.7em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--purple_bright);
		margin-bottom: 0.2em;
	}

	.description {
		font-size: 0.85em;
		color: var(--grey);
		margin: 0 0 0.5em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;

		&.compact {
			font-size: 0.8em;
			margin: 0 0 0.3em;
		}
	}

	.meta {
		display: flex;
		gap: 1em;
		font-size: 0.8em;
		color: var(--grey);
		margin-bottom: 0.5em;

		&.compact {
			gap: 0.8em;
			font-size: 0.75em;
			margin-bottom: 0.3em;
		}
	}
</style>
