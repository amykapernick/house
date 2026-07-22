<script lang="ts">
	import type { FoodPrinciples } from '$types/smallHuman';

	const {
		principles,
		class: className = '',
	}: {
		principles: FoodPrinciples;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<p>{principles.core_philosophy}</p>
	<p>{principles.note}</p>
	<h3>Current Principles</h3>
	{#each principles.current_and_ongoing as i (i.id)}
		<h4>{i.title}</h4>
		<p>{i.detail}</p>
	{/each}
	<h3>What to expect from a toddler</h3>
	{#each principles.toddler_forward_look as i (i.id)}
		<h4>{i.title}</h4>
		<p>{i.detail}</p>
	{/each}
</div>
