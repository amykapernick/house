<script lang="ts">
	import CalendarView from '$partials/calendar/Calendar.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { EVERYONE, isVisibleToUser } from '$utils/fetchFamilyMembers';
	import type { Task } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let mealPlans = $state<any[]>([]);
	let loading = $state(true);
	let selectedUserSlug = $state(EVERYONE);

	// The API resolves unassigned tasks, or tasks assigned to someone outside
	// the family, to the whole family - so `assigned` always includes every
	// member for an "everyone" task, and this filter needs no special case.
	let visibleTasks = $derived(tasks.filter((task) => isVisibleToUser(task.assigned, selectedUserSlug)));

	let visibleIcalEvents = $derived(icalEvents.filter((event) => isVisibleToUser(event.family, selectedUserSlug)));

	function handleTaskCompleted(taskId: string) {
		tasks = tasks.filter((task) => task.id !== taskId);
	}

	$effect(() => {
		if ($isAuthenticated) {
			function handleCalendar(res: any) {
				tasks = res.tasks ?? [];
				events = res.events ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'calendar',
				onStale: handleCalendar,
				gqlQuery: `
					query {
						tasks {
							id
							name
							assigned {
								name
								slug
								profile
								colour
							}
							status
							due
							end
							allDay
							estimate
							link
							platform
						}
						events {
							name
							dates {
								start
								end
							}
							status
							id
						}
					}
				`,
			}).then(handleCalendar);

			function handleIcs(res: any) { icalEvents = res.icsEvents ?? []; }
			fetchClientData({
				cacheKey: 'icsEvents',
				onStale: handleIcs,
				gqlQuery: `
					query {
						icsEvents {
							id
							name
							dates {
								start
								end
							}
							status
							allDay
							colour
							family {
								slug
							}
						}
					}
				`,
			}).then(handleIcs);

			function handleCalMeals(res: any) { mealPlans = res.mealPlans?.items ?? []; }
			fetchClientData({
				cacheKey: 'calendar-mealplans',
				onStale: handleCalMeals,
				gqlQuery: `
					query {
						mealPlans(perPage: 50, orderBy: "date", orderDirection: "asc") {
							items {
								id date entryType title
								recipe { name slug }
							}
						}
					}
				`,
			}).then(handleCalMeals);
		}
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Calendar`)}</title>
	<meta name="description" content="View combined calendars and tasks for the family" />
</svelte:head>

<h1>Calendar</h1>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<FamilyFilter bind:selectedUserSlug pageKey="calendar" />
	<CalendarView tasks={visibleTasks} allDayEvents={events} icalEvents={visibleIcalEvents} {mealPlans} onTaskCompleted={handleTaskCompleted} />
{/if}
