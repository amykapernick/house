<script lang="ts">
	import { format } from 'date-fns';
	import { isAuthenticated } from '$lib/auth';
	import fetchHabitsData from '$utils/habitsData';
	import { setCache } from '$utils/fetchClientData';
	import HabitView from '$parts/habits/HabitView.svelte';
	import type { Habit } from '$types/habits';

	let habits = $state<Habit[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleHabits(data: Habit[]) {
				habits = data;
				loading = false;
			}
			fetchHabitsData({ onStale: handleHabits }).then(handleHabits);
		}
	});

	// Keep the shared cache in sync so a revisit within the TTL doesn't show the pre-update streak.
	function handleHabitComplete(id: string) {
		habits = habits.map((habit) =>
			habit.id === id
				? { ...habit, streak: habit.streak + 1, lastCompleted: new Date().toISOString() }
				: habit
		);
		setCache(`habits-${format(new Date(), 'yyyy-MM-dd')}`, { habits });
	}
</script>

<svelte:head>
	<title>Habits | Kapers Crewe Household</title>
	<meta name="description" content="Track daily and weekly habits" />
</svelte:head>

<h1>Habits</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<HabitView {habits} onComplete={handleHabitComplete} />
{/if}
