<script lang="ts">
	import CalendarView from '$partials/calendar/Calendar.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Task } from '$types/tasks';

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let mealPlans = $state<any[]>([]);
	let loading = $state(true);

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
	<title>Calendar | Kapers Crewe Household</title>
	<meta name="description" content="View combined calendars and tasks for the family" />
</svelte:head>

<h1>Calendar</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<CalendarView {tasks} allDayEvents={events} {icalEvents} {mealPlans} onTaskCompleted={handleTaskCompleted} />
{/if}
