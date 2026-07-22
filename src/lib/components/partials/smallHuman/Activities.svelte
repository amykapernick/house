<script lang="ts">
	import type { Activity } from '$types/smallHuman';
	import Cards from '$parts/Cards.svelte';
	import Card from '$parts/smallHuman/Card.svelte';

	const {
		activities,
		class: className = '',
	}: {
		activities: Activity[];
		class?: string;
	} = $props();
</script>

<Cards class={className}>
	{#each activities as a (a.id)}
		<Card title={a.title}>
			<p>{a.detail}</p>
		</Card>
	{/each}
</Cards>
