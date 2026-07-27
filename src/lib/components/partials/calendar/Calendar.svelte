<script lang="ts">
	import { TimeGrid, DayGrid, List, Interaction } from '@event-calendar/core';
	import { SvelteDate } from 'svelte/reactivity';
	import { parseISO, setHours } from 'date-fns';
	import CalendarBase from './CalendarBase.svelte';
	import TaskEventModal from './TaskEventModal.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { completeTask } from '$utils/completeTask';
	import { isAuthenticated } from '$lib/auth';
	import fetchFamilyMembers, { EVERYONE, isVisibleToUser, type FamilyMember } from '$utils/fetchFamilyMembers';
	import formatCalendarTitle from '$utils/calendar/formatCalendarTitle';
	import formatEventTimeRange from '$utils/calendar/formatEventTimeRange';
	import notionIcon from '$img/icons/notion.svg?src';
	import todoistIcon from '$img/icons/todoist.svg?src';
	import type { Task } from '$types/tasks';

	// Matches Task.svelte's own external "open in platform" link - github tasks
	// have no icon there either (see that component's own TODO), so they're
	// skipped here the same way.
	const platformIcons: Partial<Record<Task['platform'], string>> = { notion: notionIcon, todoist: todoistIcon };

	let {
		tasks = [],
		events: sourceEvents = [],
		mealPlans = [],
		selectedUserSlug = EVERYONE,
		title = $bindable(''),
		onTaskCompleted,
		onRangeChange,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		mealPlans: any[];
		selectedUserSlug?: string;
		title?: string;
		onTaskCompleted?: (taskId: string) => void;
		onRangeChange?: (start: Date, end: Date) => void;
		class?: string;
	} = $props();

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

		onTaskCompleted?.(selectedTask.id);
		taskModalOpen = false;
	}

	let currentView = $state('timeGridWeek');
	let familyMembers = $state<FamilyMember[]>([]);

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
			? sourceEvents
			: sourceEvents.filter((event) => event.platform === 'notion' || isVisibleToUser(event.family, selectedUserSlug));

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
		// Drives the page's h1 (see +page.svelte's bind:title) - datesSet fires on
		// every navigation (prev/next/today) as well as view switches, unlike
		// viewDidMount which only fires on the latter, so this is what keeps the
		// heading in sync as the visible range changes.
		datesSet: (info: any) => {
			title = info?.view?.title ?? '';
			const end = new SvelteDate(info.end);
			end.setDate(end.getDate() - 1);
			onRangeChange?.(info.start, end);
		},
		titleFormat: (start: Date, end: Date) => formatCalendarTitle(start, end),
		headerToolbar: {
			start: 'title',
			center: 'today,prev,next',
			end: 'dayGridMonth,timeGridWeek,timeGridDay,resourceTimeGridDay,resourceTimelineWeek,listMonth',
		},
		buttonText: {
			today: 'Today',
			dayGridMonth: 'Month',
			timeGridWeek: 'Week',
			timeGridDay: 'Day',
			// resourceTimeGridDay: time runs vertically top-to-bottom, one column per
			// person - same axis as the Day view, just split by person instead of a
			// single combined column.
			resourceTimeGridDay: 'By Person',
			// resourceTimelineWeek: the opposite orientation - time runs horizontally
			// left-to-right, one row per person (a Gantt-style timeline).
			resourceTimelineWeek: 'Timeline',
			listMonth: 'List',
		},
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
		eventClick: (info: any) => {
			const { link, type, status, platform } = info.event.extendedProps;
			if (type === 'task') {
				completeError = ``;
				selectedTask = {
					id: info.event.id,
					title: info.event.title,
					due: info.event.start,
					status,
					platform,
					link,
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
		},
	};
</script>

<CalendarBase
	class={className}
	plugins={[TimeGrid, DayGrid, List, Interaction]}
	events={calendarEvents}
	{resources}
	{optionsOverride}
/>

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
