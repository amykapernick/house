<script lang="ts">
	import Card from '$parts/Card.svelte';
	import ChoreItem from './ChoreItem.svelte';
	import { formatMinutes } from '$utils/formatMinutes';
	import type { Chore } from '$types/chores';

	let {
		label,
		chores = [],
		onComplete,
		class: className = '',
	}: { label: string; chores: Chore[]; onComplete?: (id: string) => void; class?: string } = $props();

	let displayLabel = $derived(label.replaceAll('-', ' '));
	let totalDuration = $derived(chores.reduce((total, chore) => total + (chore.durationMinutes ?? 0), 0));
</script>

<Card class="routine {className}">
	<div class="header">
		<h3 class="label">{displayLabel}</h3>
		{#if totalDuration}<span class="total-duration">{formatMinutes(totalDuration)}</span>{/if}
	</div>
	<ul class="chores">
		{#each chores as chore (chore.id)}
			<li class="item">
				<ChoreItem {...chore} {onComplete} />
			</li>
		{/each}
	</ul>
</Card>

<style>
	.header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5em;
		margin: 0 0 0.5em;
	}

	.label {
		margin: 0;
		font-size: 1em;
		text-transform: capitalize;
	}

	.total-duration {
		flex-shrink: 0;
		color: var(--grey);
		font-size: 0.75em;
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
