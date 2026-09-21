<script lang="ts">
	import { resolve } from '$app/paths';
	import { isPast, isToday, startOfToday } from 'date-fns';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import Panel from '$parts/Dashboard/Panel/index.svelte';
	import HabitCheckItem from '$parts/habits/HabitCheckItem/index.svelte';
	import AllergenCheckItem from '$parts/smallHuman/AllergenCheckItem/index.svelte';
	import { isDayDone, isExplicitlyDone } from '$utils/habitCompletion';
	import type { Habit } from '$types/habits';
	import styles from './index.module.css';

	export type DueSoonItem = { due: string } & ({ type: 'habit'; habit: Habit & { due: string } } | { type: 'allergen'; allergen: any });

	let {
		items,
		loading,
		onHabitComplete,
		onAllergenComplete,
		class: className = '',
	}: {
		items: DueSoonItem[];
		loading: boolean;
		onHabitComplete?: (id: string) => void;
		onAllergenComplete?: (id: string) => void;
		class?: string;
	} = $props();

	// Warning takes priority over the due-date categories below - a habit
	// already covered by a prior completion's recurrence window shouldn't
	// also read as overdue/due/upcoming.
	function habitPillStatus(habit: Habit & { due: string }): 'warning' | 'error' | 'info' | 'success' {
		const today = startOfToday();
		if (isDayDone(today, habit.completions, habit.recurrenceInterval) && !isExplicitlyDone(today, habit.completions)) return 'warning';

		const due = new Date(habit.due);
		if (isPast(due) && !isToday(due)) return 'error';
		if (isToday(due)) return 'info';
		return 'success';
	}

	function allergenPillStatus(allergen: { due: string }): 'error' | 'info' | 'success' {
		const due = new Date(allergen.due);
		if (isPast(due) && !isToday(due)) return 'error';
		if (isToday(due)) return 'info';
		return 'success';
	}
</script>

<Panel
	title="Habits"
	class={className}
>
	{#snippet actions()}
		<a
			class={styles.link}
			href={resolve('/habits')}>View all</a
		>
	{/snippet}

	{#if loading}
		<Skeleton rows={3} />
	{:else if items.length === 0}
		<EmptyState title="Nothing due today" />
	{:else}
		<ul class={styles['habits-list']}>
			{#each items as item (item.type === 'habit' ? item.habit.id : item.allergen.id)}
				<li>
					{#if item.type === 'habit'}
						<Pill
							class={styles.habit}
							status={habitPillStatus(item.habit)}
							><HabitCheckItem
								{...item.habit}
								compact={true}
								onComplete={onHabitComplete}
							/></Pill
						>
					{:else}
						<Pill
							class={styles.habit}
							status={allergenPillStatus(item.allergen)}
							><AllergenCheckItem
								{...item.allergen}
								compact={true}
								onComplete={onAllergenComplete}
							/></Pill
						>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Panel>
