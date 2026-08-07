<script lang="ts">
	import { TimeGrid, DayGrid, List, Interaction } from '@event-calendar/core';
	import { SvelteDate } from 'svelte/reactivity';
	import { startOfWeek, endOfWeek, parseISO, setHours } from 'date-fns';
	import CalendarBase from '$partials/calendar/CalendarBase/index.svelte';
	import YearView from '$partials/calendar/YearView/index.svelte';
	import TaskEventModal from '$partials/calendar/TaskEventModal/index.svelte';
	import EventDetailModal from '$partials/calendar/EventDetailModal/index.svelte';
	import FamilyFilter from '$parts/FamilyFilter/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { completeTask } from '$utils/completeTask';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import fetchFamilyMembers, { EVERYONE, isVisibleToUser, type FamilyMember } from '$utils/fetchFamilyMembers';
	import formatCalendarTitle from '$utils/calendar/formatCalendarTitle';
	import formatEventTimeRange from '$utils/calendar/formatEventTimeRange';
	import { computePaddedRange, needsRefetch, type DateRange } from '$utils/calendar/paddedRange';
	import notionIcon from '$img/icons/notion.svg?src';
	import todoistIcon from '$img/icons/todoist.svg?src';
	import type { Task } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';

	// Matches Task.svelte's own external "open in platform" link - github tasks
	// have no icon there either (see that component's own TODO), so they're
	// skipped here the same way.
	const platformIcons: Partial<Record<Task['platform'], string>> = { notion: notionIcon, todoist: todoistIcon };

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

			// The calendar's own onRangeChange (from datesSet) only fires once it's
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

	let selectedTask = $state<{ id: string; title: string; due?: Date; status?: string; platform: `notion` | `todoist`; link: string } | null>(null);
	let taskModalOpen = $state(false);
	let completing = $state(false);
	let completeError = $state(``);

	async function completeSelectedTask() {
		if (!selectedTask) return;
		completing = true;
		completeError = ``;

		const result = await completeTask(selectedTask.id, selectedTask.platform);

		completing = false;

		if (result.queued) {
			completeError = `Offline - will complete when back online`;
			return;
		}

		if (!result.success) {
			completeError = `Couldn't mark this task complete. Try again.`;
			return;
		}

		handleTaskCompleted(selectedTask.id);
		taskModalOpen = false;
	}

	let currentView = $state('timeGridWeek');
	let showYearView = $state(false);
	let yearViewYear = $state(new Date().getFullYear());
	let familyMembers = $state<FamilyMember[]>([]);

	// Shared by optionsOverride.eventClick (info.event, the @event-calendar/core
	// shape) and YearView's onEventClick (a YearViewEvent, same extendedProps
	// shape) - both funnel task clicks into the same TaskEventModal.
	function handleEventClick(event: { id: string; title: string; start?: Date; extendedProps?: Record<string, unknown> }) {
		const { link, type, status, platform } = event.extendedProps as { type: string; link?: string; status?: unknown; platform?: unknown };
		if (type === 'task') {
			completeError = ``;
			selectedTask = {
				id: event.id,
				title: event.title,
				due: event.start,
				status: status as string,
				platform: platform as `notion` | `todoist`,
				link: link as string,
			};
			taskModalOpen = true;
			return;
		}
		if (!link) return;
		if (type === 'meal') {
			window.location.href = link;
		} else {
			window.open(link, '_blank');
		}
	}

	let selectedEvent = $state<{ title: string; start: Date; end: Date; link?: string } | null>(null);
	let eventModalOpen = $state(false);

	// YearView-only: a plain event bar there has no inline "open in platform"
	// link like the main view's eventContent affordance, so clicking it shows
	// its details in a modal instead of jumping straight to an external tab -
	// tasks still fall through to the same TaskEventModal as everywhere else.
	function handleYearEventClick(event: { id: string; title: string; start: Date; end: Date; extendedProps?: Record<string, unknown> }) {
		if ((event.extendedProps as { type?: string })?.type === 'task') {
			handleEventClick(event);
			return;
		}
		const { link } = event.extendedProps as { link?: string };
		selectedEvent = { title: event.title, start: event.start, end: event.end, link };
		eventModalOpen = true;
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchFamilyMembers((members) => (familyMembers = members)).then((members) => (familyMembers = members));
		}
	});

	// Backs the resourceTimeGridDay/resourceTimelineWeek views' per-person
	// columns/rows - only tasks and ical events carry an assignee/family (see
	// parseTasks/parseEvents), so Notion events and meal plans have no
	// resourceIds and simply won't appear in either resource view.
	let resources = $derived(
		familyMembers.map((member) => ({
			id: member.slug,
			title: member.name,
			eventBackgroundColor: member.colour ? `var(--${member.colour})` : undefined,
			eventTextColor: member.colour ? `var(--${member.colour}_text)` : undefined,
		})),
	);

	let calendarEvents = $derived.by(() => {
		// Resource views exist to show every family member side by side, so the
		// single-person "Filter by family member" selector (see FamilyFilter,
		// which defaults to "just me") is skipped there - otherwise switching to
		// By Person/Timeline would only ever populate one row/column. The
		// non-resource views (month/week/day/list) keep respecting it. Notion
		// events carry no family data and always bypass the filter, same as before
		// the events/icsEvents merge - only calendar-platform events get narrowed.
		const isResourceView = currentView?.startsWith('resource') ?? false;
		const visibleTasks = isResourceView ? tasks : tasks.filter((task) => isVisibleToUser(task.assigned, selectedUserSlug));
		const visibleEvents = isResourceView
			? events
			: events.filter((event) => event.platform === 'notion' || isVisibleToUser(event.family, selectedUserSlug));

		const taskEvents = parseTasks(visibleTasks);
		const calEvents = parseEvents(visibleEvents);

		const base: {
			id: string;
			title: string;
			start: Date;
			end: Date;
			allDay: boolean;
			backgroundColor: string;
			textColor: string;
			resourceIds: string[];
			extendedProps: {
				type: 'event' | 'task' | 'meal';
				link: string | undefined;
				status: unknown;
				platform: 'notion' | 'todoist' | 'calendar' | undefined;
			};
		}[] = [...taskEvents, ...calEvents].map((event) => ({
			id: event.id,
			title: event.title,
			start: new Date(event.start),
			end: new Date(event.end),
			allDay: event.allDay ?? false,
			backgroundColor: 'colour' in event && event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
			textColor: 'colour' in event && event.colour ? `var(--${event.colour}_text)` : event.type === 'task' ? 'var(--purple_bright_text)' : 'var(--blue_text)',
			resourceIds: event.resource?.map((member: { slug: string }) => member.slug) ?? [],
			extendedProps: {
				type: event.type,
				link: 'link' in event ? event.link : undefined,
				status: 'status' in event ? event.status : undefined,
				platform: 'platform' in event ? event.platform : undefined,
			},
		}));

		const showMeals = currentView?.startsWith('timeGrid') ?? false;
		if (showMeals && mealPlans.length) {
			for (const meal of mealPlans) {
				const day = parseISO(meal.date);
				const title = meal.recipe?.name ?? meal.title ?? meal.entryType;
				base.push({
					id: `meal-${meal.id}`,
					title: `${meal.entryType}: ${title}`,
					start: setHours(day, 18),
					end: setHours(day, 19),
					allDay: false,
					backgroundColor: 'var(--orange)',
					textColor: 'var(--orange_text)',
					resourceIds: [],
					extendedProps: {
						type: 'meal',
						link: meal.recipe?.slug ? `/recipes/${meal.recipe.slug}` : undefined,
						status: undefined,
						platform: undefined,
					},
				});
			}
		}

		return base;
	});

	const optionsOverride = {
		view: 'timeGridWeek',
		editable: false,
		selectable: true,
		dayMaxEvents: true,
		viewDidMount: (info: any) => {
			currentView = info?.type ?? info?.view?.type ?? 'timeGridWeek';
		},
		// Drives the page's h1 - datesSet fires on every navigation
		// (prev/next/today) as well as view switches, unlike viewDidMount which
		// only fires on the latter, so this is what keeps the heading in sync as
		// the visible range changes.
		datesSet: (info: any) => {
			calendarTitle = info?.view?.title ?? '';
			const end = new SvelteDate(info.end);
			end.setDate(end.getDate() - 1);
			handleRangeChange(info.start, end);
		},
		titleFormat: (start: Date, end: Date) => formatCalendarTitle(start, end),
		eventContent: (info: any) => {
			const { type, link, platform } = info.event.extendedProps;
			// allDay events/tasks have no meaningful time-of-day to show.
			const timeLabel = info.event.allDay ? '' : formatEventTimeRange(info.event.start, info.event.end);
			const timeHtml = timeLabel ? `<span class="event-time">${timeLabel}</span> ` : '';
			if (type === 'task') {
				// Same external "open in platform" link as Task.svelte - stopPropagation
				// keeps its click from also bubbling up to eventClick's modal-open handler.
				const platformLink = link ? `<a class="platform" href="${link}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()"><span class="sr-only">Open in ${platform}</span>${platformIcons[platform as Task['platform']] ?? ''}</a>` : '';
				return { html: `<span class="task">${timeHtml}${info.event.title}${platformLink}</span>` };
			}
			if (type === 'meal') {
				return { html: `<span class="meal">🍽 ${timeHtml}${info.event.title}</span>` };
			}
			return { html: `<span class="event">${timeHtml}${info.event.title}</span>` };
		},
		eventClick: (info: any) => handleEventClick(info.event),
	};
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

	{#if showYearView}
		<YearView {tasks} {events} bind:year={yearViewYear} bind:title={calendarTitle} onRangeChange={handleRangeChange} onEventClick={handleYearEventClick} onBack={() => (showYearView = false)} />
	{:else}
		<CalendarBase
			plugins={[TimeGrid, DayGrid, List, Interaction]}
			events={calendarEvents}
			{resources}
			views={['month', 'week', 'day', 'byPerson', 'timeline', 'list']}
			customViews={[{ name: 'year', text: 'Year', onClick: () => (showYearView = true) }]}
			{optionsOverride}
		/>
	{/if}

	{#if selectedTask}
		<TaskEventModal
			bind:open={taskModalOpen}
			title={selectedTask.title}
			due={selectedTask.due}
			status={selectedTask.status}
			platform={selectedTask.platform}
			link={selectedTask.link}
			saving={completing}
			error={completeError}
			onComplete={completeSelectedTask}
		/>
	{/if}

	{#if selectedEvent}
		<EventDetailModal bind:open={eventModalOpen} title={selectedEvent.title} start={selectedEvent.start} end={selectedEvent.end} link={selectedEvent.link} />
	{/if}
{/if}
