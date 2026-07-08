<script lang="ts">
	import { format, startOfWeek, endOfWeek } from 'date-fns';
	import ScheduleView from '$partials/calendar/ScheduleView.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl } from '$utils/fetchClientData';
	import type { ScheduleBlock, ScheduleSavePayload, RoutineDays, PaletteColour } from '$types/schedule';
	import type { Task } from '$types/tasks';

	let blocks = $state<ScheduleBlock[]>([]);
	let colours = $state<PaletteColour[]>([]);
	let defaultRoutineId = $state<string | null>(null);
	let loading = $state(true);
	let currentRange = $state<{ from: string; to: string } | null>(null);

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);

	function loadCalendarItems() {
		function handleCalendar(res: any) {
			tasks = res.tasks ?? [];
			events = res.events ?? [];
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
	}

	function handleTaskCompleted(taskId: string) {
		tasks = tasks.filter((task) => task.id !== taskId);
	}

	function loadColours() {
		function handleColours(res: any) {
			colours = res.colours ?? [];
		}
		fetchClientData({
			cacheKey: `colours`,
			onStale: handleColours,
			gqlQuery: `
				query {
					colours {
						name
						hex
						link
					}
				}
			`,
		}).then(handleColours);
	}

	const toDateStr = (date: Date) => format(date, 'yyyy-MM-dd');

	function loadSchedule(from: string, to: string, skipCache = false) {
		currentRange = { from, to };
		function handleSchedule(res: any) {
			blocks = res.schedule ?? [];
			defaultRoutineId = res.defaultRoutineId ?? null;
			loading = false;
		}
		fetchClientData({
			cacheKey: `schedule-${from}-${to}`,
			skipCache,
			onStale: handleSchedule,
			gqlQuery: `
				query {
					schedule(from: "${from}", to: "${to}") {
						id
						label
						start
						end
						colour
						isOverride
					}
					defaultRoutineId
				}
			`,
		}).then(handleSchedule);
	}

	function handleRangeChange(start: Date, end: Date) {
		loadSchedule(toDateStr(start), toDateStr(end));
	}

	$effect(() => {
		if ($isAuthenticated) {
			const today = new Date();
			handleRangeChange(
				startOfWeek(today, { weekStartsOn: 1 }),
				endOfWeek(today, { weekStartsOn: 1 })
			);
			loadColours();
			loadCalendarItems();
		}
	});

	const gqlStr = (value: string) => JSON.stringify(value ?? '');

	const DAY_KEYS = [`monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`] as const;

	function gqlDaysArgs(days: RoutineDays) {
		return DAY_KEYS.map((key) => {
			const items = days[key].map(
				(b) => `{label: ${gqlStr(b.label)}, start: ${gqlStr(b.start)}, end: ${gqlStr(b.end)}, colour: ${b.colour ? gqlStr(b.colour) : `null`}}`
			);
			return `${key}: [${items.join(`, `)}]`;
		}).join(`\n`);
	}

	async function handleSave(payload: ScheduleSavePayload) {
		const daysArgs = gqlDaysArgs(payload.days);

		const mutation =
			payload.scope === `default`
				? `mutation { updateDefaultRoutine(id: ${gqlStr(defaultRoutineId ?? ``)}, ${daysArgs}) { success } }`
				: `mutation { createRoutineOverride(start: ${gqlStr(payload.start)}, end: ${gqlStr(payload.end)}, ${daysArgs}) { success } }`;

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: mutation }),
		}).then((r) => r.json());

		const success =
			payload.scope === `default`
				? res?.data?.updateDefaultRoutine?.success
				: res?.data?.createRoutineOverride?.success;

		if (res?.errors || !success) {
			throw new Error(`Failed to save schedule changes`);
		}

		if (currentRange) {
			loadSchedule(currentRange.from, currentRange.to, true);
		}
	}
</script>

<svelte:head>
	<title>Schedule | Kapers Crewe Household</title>
	<meta name="description" content="Weekly routine schedule" />
</svelte:head>

<h1>Schedule</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<ScheduleView
		{blocks}
		{colours}
		{tasks}
		{events}
		{icalEvents}
		onRangeChange={handleRangeChange}
		onSave={handleSave}
		onTaskCompleted={handleTaskCompleted}
	/>
{/if}
