<script lang="ts">
	import { format, startOfWeek, endOfWeek } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import ScheduleView from '$partials/calendar/ScheduleView.svelte';
	import FocusTimer from '$parts/FocusTimer.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import TaskList from '$parts/tasks/List.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl, setCache } from '$utils/fetchClientData';
	import { EVERYONE, isVisibleToUser } from '$utils/fetchFamilyMembers';
	import type { ScheduleBlock, ScheduleSavePayload, RoutineDays, PaletteColour } from '$types/schedule';
	import type { Task, TaskStatus } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';

	let blocks = $state<ScheduleBlock[]>([]);
	let colours = $state<PaletteColour[]>([]);
	let loading = $state(true);
	let currentRange = $state<{ from: string; to: string } | null>(null);

	let tasks = $state<Task[]>([]);
	let events = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let selectedUserSlug = $state(EVERYONE);

	let visibleIcalEvents = $derived(icalEvents.filter((event) => isVisibleToUser(event.family, selectedUserSlug)));

	let visibleBlocks = $derived(
		blocks.filter((block) => isVisibleToUser(block.family ? [block.family] : [], selectedUserSlug))
	);

	// The API resolves unassigned tasks, or tasks assigned to someone outside
	// the family, to the whole family - so `assigned` always includes every
	// member for an "everyone" task, and this filter needs no special case.
	let visibleTasks = $derived(tasks.filter((task) => isVisibleToUser(task.assigned, selectedUserSlug)));

	// Undated tasks (e.g. GitHub issues, which have no due date) never appear on the
	// calendar grid itself - parseTasks in ScheduleView drops anything without a due
	// date - so surface them in a plain list instead of hiding them entirely.
	let undatedTasks = $derived(visibleTasks.filter((task) => !task.due));

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
						family {
							slug
						}
					}
				}
			`,
		}).then(handleIcs);
	}

	function handleTaskCompleted(taskId: string) {
		tasks = tasks.filter((task) => task.id !== taskId);
	}

	// Keep the shared cache in sync so a revisit within the TTL doesn't show the pre-update status.
	function handleTaskUpdate(id: string, status: TaskStatus) {
		tasks = tasks.map((task) => (task.id === id ? { ...task, status } : task));
		setCache(`calendar`, { tasks, events });
	}

	function loadColours() {
		function handleColours(res: any) {
			// The `colours` collection has one row per theme variant of a name
			// (base/Light/Dark, for CSS generation) - keep only the base row per
			// name so the colour picker doesn't offer (or key on) duplicates.
			const byName = new SvelteMap<string, PaletteColour>();
			for (const c of res.colours ?? []) {
				if (!byName.has(c.name) || !c.theme) byName.set(c.name, c);
			}
			colours = [...byName.values()];
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
						theme
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
						family {
							slug
						}
					}
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
		if (selectedUserSlug === EVERYONE) {
			throw new Error(`Select a family member before saving their schedule`);
		}

		const daysArgs = gqlDaysArgs(payload.days);
		const userArg = `user: ${gqlStr(selectedUserSlug)}`;

		const mutation =
			payload.scope === `default`
				? `mutation { updateDefaultRoutine(${userArg}, ${daysArgs}) { success } }`
				: `mutation { createRoutineOverride(${userArg}, start: ${gqlStr(payload.start)}, end: ${gqlStr(payload.end)}, ${daysArgs}) { success } }`;

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
	<title>{getPageTitle(`Schedule`)}</title>
	<meta name="description" content="Weekly routine schedule" />
</svelte:head>

<h1>Schedule</h1>
<FocusTimer />
{#if loading}
	<p>Loading...</p>
{:else}
	<FamilyFilter bind:selectedUserSlug pageKey="schedule" />
	<ScheduleView
		blocks={visibleBlocks}
		{colours}
		tasks={visibleTasks}
		{events}
		icalEvents={visibleIcalEvents}
		readOnly={selectedUserSlug === EVERYONE}
		onRangeChange={handleRangeChange}
		onSave={handleSave}
		onTaskCompleted={handleTaskCompleted}
	/>
	{#if undatedTasks.length}
		<h2>Undated tasks</h2>
		<TaskList tasks={undatedTasks} onUpdate={handleTaskUpdate} />
	{/if}
{/if}
