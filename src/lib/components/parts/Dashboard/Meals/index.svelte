<script lang="ts">
	import { resolve } from '$app/paths';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import Panel from '$parts/Dashboard/Panel/index.svelte';
	import RecipeCard from '$parts/recipes/RecipeCard/index.svelte';
	import styles from './index.module.css';

	let {
		recipes,
		loading,
		class: className = '',
	}: {
		recipes: { recipe: any; days: string[] }[];
		loading: boolean;
		class?: string;
	} = $props();
</script>

<Panel
	title="This week's meals"
	class={className}
>
	{#snippet actions()}
		<a
			class={styles.link}
			href={resolve('/meal-plan')}>View all</a
		>
	{/snippet}

	{#if loading}
		<Skeleton rows={3} />
	{:else if recipes.length === 0}
		<EmptyState title="No meals planned this week" />
	{:else}
		<div class={styles.grid}>
			{#each recipes as { recipe, days } (recipe.slug)}
				<RecipeCard
					{recipe}
					size="compact"
					dayLabel={days.length ? days.join(', ') : undefined}
				>
					{#snippet tags(recipeTags)}
						<ul class={styles.tags}>
							{#each recipeTags as tag (tag.slug)}
								<li>{tag.name}</li>
							{/each}
						</ul>
					{/snippet}
				</RecipeCard>
			{/each}
		</div>
	{/if}
</Panel>
