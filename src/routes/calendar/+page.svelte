<script lang="ts">
	import CalendarView from '$partials/Calendar.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Task } from '$types/tasks';

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let mealPlans = $state<any[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({
				cacheKey: 'calendar',
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
			}).then((res) => {
				tasks = res.tasks ?? [];
				events = res.events ?? [];
				loading = false;
			});

			fetchClientData({
				cacheKey: 'icsEvents',
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
			}).then((res) => {
				icalEvents = res.icsEvents ?? [];
			});

			fetchClientData({
				cacheKey: 'calendar-mealplans',
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
			}).then((res) => {
				mealPlans = res.mealPlans?.items ?? [];
			});
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
	<CalendarView {tasks} allDayEvents={events} {icalEvents} {mealPlans} />
{/if}
