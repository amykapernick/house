<script lang="ts">
	import Card from '$parts/Card.svelte';
	import ChoreItem from './ChoreItem.svelte';
	import type { Chore } from '$types/chores';

	let {
		label,
		chores = [],
		onComplete,
		class: className = '',
	}: { label: string; chores: Chore[]; onComplete?: (id: string) => void; class?: string } = $props();
</script>

<Card class="routine {className}">
	<h3 class="label">{label}</h3>
	<ul class="chores">
		{#each chores as chore (chore.id)}
			<li class="item">
				<ChoreItem {...chore} {onComplete} />
			</li>
		{/each}
	</ul>
</Card>

<style>
	.label {
		margin: 0 0 0.5em;
		font-size: 1em;
		text-transform: capitalize;
	}

	.chores {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		margin: 0.3em 0;
	}
</style>
