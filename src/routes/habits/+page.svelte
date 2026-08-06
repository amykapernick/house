<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchHabitsData from '$utils/habitsData';
	import { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import fetchFamilyMembers, { EVERYONE, isVisibleToUser } from '$utils/fetchFamilyMembers';
	import type { FamilyMember } from '$utils/fetchFamilyMembers';
	import HabitView from '$parts/habits/HabitView/index.svelte';
	import FamilyFilter from '$parts/FamilyFilter/index.svelte';
	import AddHabitModal from '$parts/habits/AddHabitModal/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import type { Habit } from '$types/habits';
	import { getPageTitle } from '$utils/pageTitle';

	let habits = $state<Habit[]>([]);
	let loading = $state(true);
	let selectedUserSlug = $state(EVERYONE);
	let familyMembers = $state<FamilyMember[]>([]);

	// The API resolves unassigned habits, or habits assigned to someone outside
	// the family, to the whole family - so `assigned` always includes every
	// member for an "everyone" habit, and this filter needs no special case.
	let visibleHabits = $derived(habits.filter((habit) => isVisibleToUser(habit.assigned, selectedUserSlug)));

	function handleHabits(data: Habit[]) {
		habits = data;
		loading = false;
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchHabitsData({ onStale: handleHabits }).then(handleHabits);
			fetchFamilyMembers((members) => (familyMembers = members)).then((members) => (familyMembers = members));
		}
	});

	// Keep the shared cache in sync so a revisit within the TTL doesn't show the pre-update streak.
	function handleHabitComplete(id: string) {
		habits = habits.map((habit) => (habit.id === id ? { ...habit, streak: habit.streak + 1, lastCompleted: new Date().toISOString() } : habit));
		setCache(`habits-${format(new Date(), DATE_FORMATS.iso)}`, { habits });
	}

	// Add habit modal
	let addModalOpen = $state(false);
	let draftName = $state(``);
	let draftRecurrence = $state(``);
	let draftAssignedUserSlug = $state(EVERYONE);
	let saving = $state(false);
	let saveError = $state(``);

	function openAddModal() {
		draftName = ``;
		draftRecurrence = ``;
		draftAssignedUserSlug = EVERYONE;
		saveError = ``;
		addModalOpen = true;
	}

	const gqlStr = (value: string) => JSON.stringify(value);

	async function handleAddHabit() {
		saving = true;
		saveError = ``;

		const parts = [`name: ${gqlStr(draftName.trim())}`];
		if (draftRecurrence.trim()) parts.push(`recurrence: ${gqlStr(draftRecurrence.trim())}`);
		if (draftAssignedUserSlug !== EVERYONE) parts.push(`assignedUserSlug: ${gqlStr(draftAssignedUserSlug)}`);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: `mutation { createHabit(${parts.join(`, `)}) { success } }` }),
		}).then((r) => r.json());

		saving = false;

		if (res?.errors || !res?.data?.createHabit?.success) {
			saveError = "Couldn't add habit. Try again.";
			return;
		}

		addModalOpen = false;
		fetchHabitsData({ onStale: handleHabits }).then(handleHabits);
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Habits`)}</title>
	<meta
		name="description"
		content="Track daily and weekly habits"
	/>
</svelte:head>

<h1>Habits</h1>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<button
		class="add"
		type="button"
		onclick={openAddModal}>Add habit</button
	>
	<FamilyFilter
		bind:selectedUserSlug
		pageKey="habits"
	/>
	<HabitView
		habits={visibleHabits}
		{selectedUserSlug}
		onComplete={handleHabitComplete}
	/>
{/if}

<AddHabitModal
	bind:open={addModalOpen}
	bind:name={draftName}
	bind:recurrence={draftRecurrence}
	bind:assignedUserSlug={draftAssignedUserSlug}
	{familyMembers}
	{saving}
	error={saveError}
	onSave={handleAddHabit}
/>

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.add {

		/* position: absolute; */
		grid-column: 1;
		grid-row: 1;
		place-self: center end;
	}
</style>
