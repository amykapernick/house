<script lang="ts">
	import { startOfWeek, endOfWeek } from 'date-fns';
	import CalendarView from '$partials/calendar/Calendar.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { EVERYONE } from '$utils/fetchFamilyMembers';
	import { computePaddedRange, needsRefetch, type DateRange } from '$utils/calendar/paddedRange';
	import type { Task } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let mealPlans = $state<any[]>([]);
	let loading = $state(true);
	let selectedUserSlug = $state(EVERYONE);
	let calendarTitle = $state(``);

	// Not reactive state - just tracks what's already been fetched so
	// handleRangeChange can skip a refetch when navigation stays inside it.
	let lastFetchedRange: DateRange | null = null;

	function handleTaskCompleted(taskId: string) {
		tasks = tasks.filter((task) => task.id !== taskId);
	}

	// Fetches a padded window (~3x the visible range, centered on it) rather than
	// exactly what's on screen, so stepping prev/next usually stays inside
	// already-fetched data. skipCache since this padding+containment check *is*
	// the cache - a fetchClientData localStorage entry per distinct padded window
	// browsed would grow much faster than it'd ever get reused.
	function loadEvents(visible: DateRange) {
		const padded = computePaddedRange(visible);
		lastFetchedRange = padded;

		function handleEvents(res: any) { events = res.events ?? []; }
		fetchClientData({
			skipCache: true,
			onStale: handleEvents,
			gqlQuery: `
				query {
					events(start: "${padded.start.toISOString()}", end: "${padded.end.toISOString()}") {
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
						platform
					}
				}
			`,
		}).then(handleEvents);
	}

	function handleRangeChange(start: Date, end: Date) {
		const visible = { start, end };
		if (needsRefetch(visible, lastFetchedRange)) {
			loadEvents(visible);
		}
	}

	$effect(() => {
		if ($isAuthenticated) {
			function handleCalendar(res: any) {
				tasks = res.tasks ?? [];
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
					}
				`,
			}).then(handleCalendar);

			// Calendar.svelte's own onRangeChange (from datesSet) only fires once it's
			// mounted, which can't happen before this page stops loading - so the
			// first fetch is seeded here from the same initial week CalendarBase itself
			// defaults to (firstDay: 1), same pattern as schedule/+page.svelte.
			const today = new Date();
			handleRangeChange(
				startOfWeek(today, { weekStartsOn: 1 }),
				endOfWeek(today, { weekStartsOn: 1 })
			);

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

<h1>{calendarTitle || `Calendar`}</h1>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<FamilyFilter bind:selectedUserSlug pageKey="calendar" />
	<CalendarView {tasks} {events} {mealPlans} {selectedUserSlug} bind:title={calendarTitle} onRangeChange={handleRangeChange} onTaskCompleted={handleTaskCompleted} />
{/if}
