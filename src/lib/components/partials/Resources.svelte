<script lang="ts">
	import type { Resource } from '$types/resources';
	import Card from '$parts/resources/Card.svelte';

	let { items, class: className = '' }: { items: Resource[]; class?: string } = $props();

	let grouped = $derived.by(() => {
		const groups: Record<string, Resource[]> = {};
		items.forEach((resource) => {
			const rawCategories = resource?.category;
			const categories = Array.isArray(rawCategories) ? rawCategories : rawCategories ? [rawCategories] : [];
			const resourceCategories = categories.length ? categories : ['Other'];
			resourceCategories.forEach((category) => {
				if (!groups[category]) groups[category] = [];
				groups[category].push(resource);
			});
		});
		return groups;
	});
</script>

{#each Object.entries(grouped) as [category, categoryResources] (category)}
	<Card {category} items={categoryResources} />
{/each}
