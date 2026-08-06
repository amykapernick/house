<script lang="ts">
	import Card from '$parts/Card/index.svelte';
	import ChoreItem from '../ChoreItem/index.svelte';
	import { formatMinutes } from '$utils/formatMinutes';
	import type { Chore } from '$types/chores';
	import styles from './index.module.css';

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
	<div class={styles.header}>
		<h3 class={styles.label}>{displayLabel}</h3>
		{#if totalDuration}<span class={styles['total-duration']}>{formatMinutes(totalDuration)}</span>{/if}
	</div>
	<ul class={styles.chores}>
		{#each chores as chore (chore.id)}
			<li class={styles.item}>
				<ChoreItem {...chore} {onComplete} />
			</li>
		{/each}
	</ul>
</Card>
