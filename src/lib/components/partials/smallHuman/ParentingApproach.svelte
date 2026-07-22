<script lang="ts">
	import type { ParentingApproachItem } from '$types/smallHuman';
	import Cards from '$parts/Cards.svelte';
	import Card from '$parts/smallHuman/Card.svelte';

	const {
		items,
		class: className = '',
	}: {
		items: ParentingApproachItem[];
		class?: string;
	} = $props();
</script>

<Cards class={className}>
	{#each items as a (a.id)}
		<Card title={a.title}>
			<p>{a.detail}</p>
		</Card>
	{/each}
</Cards>
