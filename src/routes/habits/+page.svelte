<script lang="ts">
	import { format } from 'date-fns';
	import { isAuthenticated } from '$lib/auth';
	import fetchHabitsData from '$utils/habitsData';
	import { setCache } from '$utils/fetchClientData';
	import fetchFamilyMembers, { EVERYONE, isVisibleToUser, type FamilyMember } from '$utils/fetchFamilyMembers';
	import HabitView from '$parts/habits/HabitView.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import type { Habit } from '$types/habits';

	let habits = $state<Habit[]>([]);
	let loading = $state(true);
	let familyMembers = $state<FamilyMember[]>([]);
	let selectedUserSlug = $state(EVERYONE);

	// The API resolves unassigned habits, or habits assigned to someone outside
	// the family, to the whole family - so `assigned` always includes every
	// member for an "everyone" habit, and this filter needs no special case.
	let visibleHabits = $derived(habits.filter((habit) => isVisibleToUser(habit.assigned, selectedUserSlug)));

	$effect(() => {
		if ($isAuthenticated) {
			function handleHabits(data: Habit[]) {
				habits = data;
				loading = false;
			}
			fetchHabitsData({ onStale: handleHabits }).then(handleHabits);

			function handleFamily(members: FamilyMember[]) { familyMembers = members; }
			fetchFamilyMembers(handleFamily).then(handleFamily);
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
	<FamilyFilter {familyMembers} bind:selectedUserSlug />
	<HabitView habits={visibleHabits} onComplete={handleHabitComplete} />
{/if}
