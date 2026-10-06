<script lang="ts">
	import { startOfWeek, endOfWeek, addDays, startOfDay, parseISO, setHours, subDays } from 'date-fns';
	import CalendarBase from '$partials/calendar/CalendarBase/index.svelte';
	import EventContent from '$partials/calendar/CalendarBase/EventContent.svelte';
	import YearView from '$partials/calendar/YearView/index.svelte';
	import TimelineView from '$partials/calendar/TimelineView/index.svelte';
	import TaskEventModal from '$partials/calendar/TaskEventModal/index.svelte';
	import EventDetailModal from '$partials/calendar/EventDetailModal/index.svelte';
	import FamilyFilter from '$parts/FamilyFilter/index.svelte';
	import EventLegend from '$partials/calendar/EventLegend/index.svelte';
	import SegmentedToggle from '$parts/SegmentedToggle/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { completeTask } from '$utils/completeTask';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import fetchFamilyMembers, { EVERYONE, isVisibleToUser, type FamilyMember } from '$utils/fetchFamilyMembers';
	import formatCalendarTitle from '$utils/calendar/formatCalendarTitle';
	import { computePaddedRange, needsRefetch, type DateRange } from '$utils/calendar/paddedRange';
	import { getSavedView, saveView } from '$utils/calendar/viewPreference';
	import type { CalendarInstanceApi } from '@svar-ui/svelte-calendar';
	import type { Task } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';
	import styles from './+page.module.css';

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

		function handleEvents(res: any) {
			events = res.events ?? [];
		}
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
			handleRangeChange(startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 }));

			function handleCalMeals(res: any) {
				mealPlans = res.mealPlans?.items ?? [];
			}
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

	type SvarView = 'month' | 'week' | 'day' | 'agenda' | 'resources';

	// Per-device "last view used" (see viewPreference.ts, same localStorage
	// convention as FamilyFilter's own per-page persistence) - read once,
	// synchronously, so the very first render already lands on it rather
	// than flashing the 'week' default before correcting itself.
	const savedView = getSavedView('calendar');
	const savedSvarView = savedView && savedView !== 'year' && savedView !== 'timeline' ? savedView : 'week';

	let currentView = $state<SvarView>(savedSvarView);
	let activeCustomView = $state<'year' | 'timeline' | null>(savedView === 'year' || savedView === 'timeline' ? savedView : null);
	// Seeds CalendarBase's initial view when it remounts after Year/Timeline
	// swapped it out (see optionsOverride below) - kept distinct from
	// currentView so a Year/Timeline visit doesn't lose track of which SVAR
	// view to come back to.
	let lastSvarView = $state<SvarView>(savedSvarView);
	// Drives the unified view switcher below - kept in sync with
	// currentView/activeCustomView (see optionsOverride.init's subscribe and
	// selectView) rather than derived from them, since the switcher's own
	// SegmentedToggle needs a plain bindable value.
	let viewId = $state<SvarView | 'year' | 'timeline'>(savedView ?? 'week');
	// 1-based column of today's header cell within the visible week (matches
	// CSS :nth-child) - null when the week view isn't showing today, or
	// isn't the active view at all. Drives the .today-col-N classes in
	// +page.module.css (nth-child can't take a CSS variable, so this picks
	// one of 7 static rules rather than computing the position purely in
	// CSS).
	let todayHeaderCol = $state<number | null>(null);
	let yearViewYear = $state(new Date().getFullYear());
	let timelineDate = $state(startOfDay(new Date()));
	let familyMembers = $state<FamilyMember[]>([]);
	// Not reactive state - just an imperative handle for the nav
	// buttons/switcher below to drive the mounted SVAR calendar from outside
	// (same pattern CalendarBase's own internal calendarApi used before its
	// toolbar was disabled - see onApi).
	let calendarApiRef: CalendarInstanceApi | undefined;

	const viewOptions: { value: SvarView | 'year' | 'timeline'; label: string }[] = [
		{ value: 'month', label: 'Month' },
		{ value: 'week', label: 'Week' },
		{ value: 'day', label: 'Day' },
		{ value: 'agenda', label: 'Agenda' },
		{ value: 'resources', label: 'Resources' },
		{ value: 'year', label: 'Year' },
		{ value: 'timeline', label: 'Timeline' },
	];

	// Persist every change (covers clicks via selectView and SVAR's own
	// currentViewStore updates alike, since both write viewId) so the next
	// visit reopens on it instead of always resetting to week.
	$effect(() => {
		saveView('calendar', viewId);
	});

	// Takes the clicked id directly (via SegmentedToggle's onOptionClick)
	// rather than reading viewId back out - onOptionClick is documented to
	// fire on every click with the option's own value, so this doesn't
	// depend on winning a race against bind:value's own update from the
	// same native change event.
	function selectView(id: SvarView | 'year' | 'timeline') {
		if (id === 'year' || id === 'timeline') {
			activeCustomView = id;
			return;
		}
		lastSvarView = id;
		if (activeCustomView !== null) {
			// CalendarBase was unmounted (Year/Timeline was active) - swapping
			// it back in remounts it fresh, landing on lastSvarView via
			// optionsOverride.view below.
			activeCustomView = null;
			return;
		}
		calendarApiRef?.exec('navigate-to', { view: id });
	}

	function goPrev() {
		if (activeCustomView === 'year') {
			yearViewYear -= 1;
			return;
		}
		if (activeCustomView === 'timeline') {
			timelineDate = addDays(timelineDate, -1);
			return;
		}
		calendarApiRef?.exec('navigate-time', { direction: 'previous' });
	}

	function goNext() {
		if (activeCustomView === 'year') {
			yearViewYear += 1;
			return;
		}
		if (activeCustomView === 'timeline') {
			timelineDate = addDays(timelineDate, 1);
			return;
		}
		calendarApiRef?.exec('navigate-time', { direction: 'next' });
	}

	function goToday() {
		if (activeCustomView === 'year') {
			yearViewYear = new Date().getFullYear();
			return;
		}
		if (activeCustomView === 'timeline') {
			timelineDate = startOfDay(new Date());
			return;
		}
		calendarApiRef?.exec('navigate-time', { direction: 'now' });
	}

	// Shared by the SVAR select-event intercept below (which adapts SVAR's
	// {id, text, start, extendedProps} shape into this one) and YearView's
	// onEventClick (a YearViewEvent, same extendedProps shape) - both funnel
	// task clicks into the same TaskEventModal.
	function handleEventClick(event: { id: string; title: string; start?: Date; extendedProps?: Record<string, unknown> }) {
		const { link, type, status, platform, eventId } = event.extendedProps as { type: string; link?: string; status?: unknown; platform?: unknown; eventId?: string };
		if (type === 'task') {
			completeError = ``;
			selectedTask = {
				// eventId (not event.id) - the Resources view gives a task
				// assigned to several people one composite-id copy per
				// person (see CalendarBase's svarEvents), so event.id alone
				// isn't a real completeTask-able id there.
				id: eventId ?? event.id,
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

	// Shared by YearView and TimelineView: a plain event bar there has no
	// inline "open in platform" link like the main view's EventContent
	// affordance, so clicking it shows its details in a modal instead of
	// jumping straight to an external tab - tasks still fall through to the
	// same TaskEventModal as everywhere else.
	function handleCustomViewEventClick(event: { id: string; title: string; start: Date; end: Date; extendedProps?: Record<string, unknown> }) {
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

	// Backs the Resources view's per-person columns and the custom Timeline
	// view's per-person rows - only tasks and ical events carry an
	// assignee/family (see parseTasks/parseEvents), so Notion events and meal
	// plans have no resourceIds and simply won't appear in either.
	let resources = $derived(
		familyMembers.map((member) => ({
			id: member.slug,
			title: member.name,
			colour: member.colour ? `var(--${member.colour})` : undefined,
			textColour: member.colour ? `var(--${member.colour}_text)` : undefined,
		})),
	);

	let calendarEvents = $derived.by(() => {
		// Resource views exist to show every family member side by side, so the
		// single-person "Filter by family member" selector (see FamilyFilter,
		// which defaults to "just me") is skipped there - otherwise switching to
		// Resources/Timeline would only ever populate one row/column. The
		// non-resource views (month/week/day/agenda) keep respecting it. Notion
		// events carry no family data and always bypass the filter, same as before
		// the events/icsEvents merge - only calendar-platform events get narrowed.
		const isResourceView = currentView === 'resources' || activeCustomView === 'timeline';
		const visibleTasks = isResourceView ? tasks : tasks.filter((task) => isVisibleToUser(task.assigned, selectedUserSlug));
		const visibleEvents = isResourceView ? events : events.filter((event) => event.platform === 'notion' || isVisibleToUser(event.family, selectedUserSlug));

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
				eventId: string;
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
				// The Resources view explodes an event assigned to several
				// people into one copy per resource, each with a composite id
				// (see CalendarBase's svarEvents) so SVAR treats them as
				// distinct - extendedProps carries the true id through
				// untouched so handleEventClick below still operates on the
				// real task/event, not a "taskId::resourceId" string.
				eventId: event.id,
			},
		}));

		const showMeals = currentView === 'week' || currentView === 'day';
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
						eventId: `meal-${meal.id}`,
					},
				});
			}
		}

		return base;
	});

	// Week/day rows default to SVAR's 100px/hour - shrunk here to a more
	// compact ~3em (see HOUR_PX) and, since the page has real room to scroll
	// (unlike the dashboard's small DayView widget), the visible window is
	// also capped to 5am-11pm (see .timedView in +page.module.css) with the
	// full 0-24 range still reachable by scrolling - initial/on-switch scroll
	// position is nudged to 5am the same way DayView.svelte does, since SVAR
	// has no scroll-to-time API.
	const HOUR_PX = 48;
	const INITIAL_SCROLL_HOUR = 5;
	const timedYScale = { yScale: { startHour: 0, endHour: 24, ui: { minUnitHeight: HOUR_PX } } };
	// "%D\n%j" (SVAR's dateToString token syntax, not a recognised locale
	// format name so it's used as a literal pattern - see
	// @svar-ui/lib-dom's dateToString) splits the day header onto two lines:
	// short weekday name, then bare day-of-month number - CSS below styles
	// them independently via ::first-line (see .wx-x-header-cell in
	// CalendarBase/index.module.css). Both sections share the same xScale
	// since Sections.svelte's shared header row can be sourced from either.
	// Day's own DayViewModel hides this header by default (xScale.visible:
	// false) - a sensible default for the small dashboard DayView widget
	// (see DayView.svelte), which has no room for it, but this full page
	// has the space and should read consistently with week's per-column
	// header, so it's switched back on here for this view only.
	const weekHeaderFormat = { xScale: { format: '%D\n%j' } };
	const dayHeaderFormat = { xScale: { visible: true, format: '%D\n%j' } };
	const sectionOverrides = {
		week: { multiday: weekHeaderFormat, timeGrid: { ...timedYScale, ...weekHeaderFormat } },
		day: { multiday: dayHeaderFormat, timeGrid: { ...timedYScale, ...dayHeaderFormat } },
	};

	// $derived (not a plain const) so a fresh CalendarBase instance - after
	// Year/Timeline swapped it out and back in - remounts directly on
	// lastSvarView instead of always restarting on 'week'.
	let optionsOverride = $derived({
		view: lastSvarView,
		readonly: true,
		eventContent: EventContent,
		// The page owns nav/today/view-switching itself (see the toolbar
		// markup below) rather than SVAR's own internal toolbar, so that
		// control set stays identical across every view instead of
		// disappearing/changing shape when Year/Timeline swap this component
		// out entirely.
		toolbar: null,
		init: (api: CalendarInstanceApi) => {
			const { currentView: currentViewStore, visibleDateRange } = api.getReactiveState();
			currentViewStore.subscribe((view) => {
				// SVAR's own store types this as a plain string, but it can only
				// ever be one of the views this component was configured with.
				currentView = view as SvarView;
				viewId = view as SvarView;
				if (view === 'week' || view === 'day') {
					requestAnimationFrame(() => {
						const scrollEl = document.querySelector<HTMLElement>(`.${styles.calendar} .wx-sections`);
						if (scrollEl) scrollEl.scrollTop = INITIAL_SCROLL_HOUR * HOUR_PX;
					});
				}
			});
			// Fires on every navigation (prev/next/today) as well as view
			// switches - drives both the page's h1 and event refetching, same
			// dual role @event-calendar/core's datesSet played.
			visibleDateRange.subscribe((range) => {
				const end = subDays(range.end, 1);
				calendarTitle = formatCalendarTitle(range.start, end);
				handleRangeChange(range.start, end);

				if (currentView === 'week') {
					const dayOffset = Math.round((startOfDay(new Date()).getTime() - range.start.getTime()) / 86_400_000);
					todayHeaderCol = dayOffset >= 0 && dayOffset < 7 ? dayOffset + 1 : null;
				} else {
					todayHeaderCol = null;
				}
			});
			// SVAR's click routes through select-event (see clickevent.js) - veto
			// its own editorData bookkeeping (unused, this app has its own modals)
			// and adapt {id, text, extendedProps} into handleEventClick's shape.
			api.intercept('select-event', (action) => {
				const { id } = action as { id: string | number | null };
				if (id == null) return false;
				const event = api.getEvent(id);
				if (event) handleEventClick({ id: String(event.id), title: (event as { text?: string }).text ?? '', start: event.start, extendedProps: (event as { extendedProps?: Record<string, unknown> }).extendedProps });
				return false;
			});
		},
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Calendar`)}</title>
	<meta
		name="description"
		content="View combined calendars and tasks for the family"
	/>
</svelte:head>

<Title>{calendarTitle || `Calendar`}</Title>
{#if loading}
	<Skeleton
		rows={3}
		class={styles.loading}
	/>
{:else}
	<FamilyFilter
		bind:selectedUserSlug
		pageKey="calendar"
		class={styles.filter}
	/>
	<EventLegend class={styles.legend} />
	<SegmentedToggle
		legend="Calendar view"
		name="calendar-view"
		options={viewOptions}
		bind:value={viewId}
		onOptionClick={selectView}
		class={styles.viewToggle}
	/>
	<div class={styles.controls}>
		<button
			type="button"
			class="secondary"
			onclick={goPrev}
			aria-label="Previous">‹</button
		>
		<button
			type="button"
			class="secondary"
			onclick={goToday}>Today</button
		>
		<button
			type="button"
			class="secondary"
			onclick={goNext}
			aria-label="Next">›</button
		>
	</div>

	{#if activeCustomView === 'year'}
		<YearView
			{tasks}
			{events}
			bind:year={yearViewYear}
			bind:title={calendarTitle}
			onRangeChange={handleRangeChange}
			onEventClick={handleCustomViewEventClick}
			class={styles.calendar}
		/>
	{:else if activeCustomView === 'timeline'}
		<TimelineView
			{tasks}
			{events}
			{resources}
			bind:date={timelineDate}
			bind:title={calendarTitle}
			onRangeChange={handleRangeChange}
			onEventClick={handleCustomViewEventClick}
			class={styles.calendar}
		/>
	{:else}
		<CalendarBase
			events={calendarEvents}
			{resources}
			views={['month', 'week', 'day', 'agenda', 'resources']}
			{sectionOverrides}
			{optionsOverride}
			onApi={(api) => (calendarApiRef = api)}
			class="{styles.calendar} {currentView === 'week' || currentView === 'day' ? styles.timedView : ''} {todayHeaderCol ? styles[`today-col-${todayHeaderCol}`] : ''}"
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
		<EventDetailModal
			bind:open={eventModalOpen}
			title={selectedEvent.title}
			start={selectedEvent.start}
			end={selectedEvent.end}
			link={selectedEvent.link}
		/>
	{/if}
{/if}
