<script lang="ts">
	import HabitItem from './HabitItem.svelte';
	import type { Habit, HabitFrequency } from '$types/habits';

	let {
		habits = [],
		onComplete,
	}: { habits: Habit[]; onComplete?: (id: string) => void } = $props();

	const sectionOrder: HabitFrequency[] = ['Daily', 'Weekly', 'Other'];

	let sections = $derived(
		sectionOrder
			.map((frequency) => ({ frequency, items: habits.filter((habit) => habit.frequency === frequency) }))
			.filter((section) => section.items.length > 0)
	);
</script>

{#each sections as { frequency, items } (frequency)}
	<section class="group">
		<h2>{frequency}</h2>
		<ul class="list">
			{#each items as habit (habit.id)}
				<li class="item">
					<HabitItem {...habit} {onComplete} />
				</li>
			{/each}
		</ul>
	</section>
{/each}

<style>
	.group {
		margin-bottom: 1.5em;
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		margin: 0.3em 0;
	}
</style>
