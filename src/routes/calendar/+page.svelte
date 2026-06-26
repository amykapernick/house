<script lang="ts">
	import CalendarView from '$partials/Calendar.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Task } from '$types/tasks';

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let loading = $state(true);

	const ICS_CACHE_KEY = 'icsEvents';
	const ICS_CACHE_TTL = 30 * 60 * 1000;

	function getCachedIcsEvents(): any[] | null {
		try {
			const cached = localStorage.getItem(ICS_CACHE_KEY);
			if (!cached) return null;
			const { data, timestamp } = JSON.parse(cached);
			if (Date.now() - timestamp > ICS_CACHE_TTL) return null;
			return data;
		} catch {
			return null;
		}
	}

	function cacheIcsEvents(data: any[]) {
		try {
			localStorage.setItem(ICS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
		} catch {}
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({
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

			const cached = getCachedIcsEvents();
			if (cached) {
				icalEvents = cached;
			}

			fetchClientData({
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
				const data = res.icsEvents ?? [];
				icalEvents = data;
				cacheIcsEvents(data);
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
	<CalendarView {tasks} allDayEvents={events} {icalEvents} />
{/if}
