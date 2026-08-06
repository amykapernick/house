<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import RoutineCard from '../RoutineCard/index.svelte';
	import ChoreItem from '../ChoreItem/index.svelte';
	import type { Chore } from '$types/chores';
	import styles from './index.module.css';

	let { chores = [], onComplete, class: className = '' }: { chores: Chore[]; onComplete?: (id: string) => void; class?: string } = $props();

	// A chore's first label is treated as its routine - a task's other labels (e.g. "urgent")
	// don't create extra groups, since rendering it under two labels would give it independent,
	// out-of-sync completion state in each group.
	let routines = $derived.by(() => {
		const groups = new SvelteMap<string, Chore[]>();
		for (const chore of chores) {
			if (!chore.labels.length) continue;
			const [routine] = chore.labels;
			if (!groups.has(routine)) groups.set(routine, []);
			groups.get(routine)!.push(chore);
		}
		return Array.from(groups, ([label, routineChores]) => ({ label, chores: routineChores }));
	});

	let unlabelled = $derived(chores.filter((chore) => chore.labels.length === 0));
</script>

<ul class="{styles.list} {className}">
	{#each routines as { label, chores: routineChores } (label)}
		<li class={styles.item}>
			<RoutineCard
				{label}
				chores={routineChores}
				{onComplete}
			/>
		</li>
	{/each}
	{#each unlabelled as chore (chore.id)}
		<li class={styles.item}>
			<ChoreItem
				{...chore}
				{onComplete}
			/>
		</li>
	{/each}
</ul>
