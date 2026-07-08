<script lang="ts">
	import { TimeGrid, DayGrid, List, Interaction } from '@event-calendar/core';
	import { parseISO, setHours } from 'date-fns';
	import CalendarBase from './CalendarBase.svelte';
	import TaskEventModal from './TaskEventModal.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { getToken } from '$lib/auth';
	import type { Task } from '$types/tasks';

	let {
		tasks = [],
		allDayEvents = [],
		icalEvents = [],
		mealPlans = [],
		onTaskCompleted,
	}: {
		tasks: Task[];
		allDayEvents: any[];
		icalEvents: any[];
		mealPlans: any[];
		onTaskCompleted?: (taskId: string) => void;
	} = $props();

	let selectedTask = $state<{ id: string; title: string; due?: Date; status?: string; platform: `notion` | `todoist`; link: string } | null>(null);
	let taskModalOpen = $state(false);
	let completing = $state(false);
	let completeError = $state(``);

	async function completeSelectedTask() {
		if (!selectedTask) return;
		completing = true;
		completeError = ``;

		const token = await getToken();
		const res = await fetch(`/api/graphql`, {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { completeTask(taskId: "${selectedTask.id}", platform: ${selectedTask.platform}) { success } }`,
			}),
		}).then((r) => r.json());

		completing = false;

		if (!res?.data?.completeTask?.success) {
			completeError = `Couldn't mark this task complete. Try again.`;
			return;
		}

		onTaskCompleted?.(selectedTask.id);
		taskModalOpen = false;
	}

	let currentView = $state('timeGridWeek');

	let calendarEvents = $derived.by(() => {
		const taskEvents = parseTasks(tasks);
		const calEvents = parseEvents(allDayEvents);
		const icsEvents = parseEvents(icalEvents);

		const base: {
			id: string;
			title: string;
			start: Date;
			end: Date;
			allDay: boolean;
			backgroundColor: string;
			extendedProps: {
				type: 'event' | 'task' | 'meal';
				link: string | undefined;
				status: unknown;
				platform: 'notion' | 'todoist' | undefined;
			};
		}[] = [...taskEvents, ...calEvents, ...icsEvents].map((event) => ({
			id: event.id,
			title: event.title,
			start: new Date(event.start),
			end: new Date(event.end),
			allDay: event.allDay ?? false,
			backgroundColor: 'colour' in event && event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
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
		headerToolbar: {
			start: 'title',
			center: '',
			end: 'today prev,next dayGridMonth,timeGridWeek,timeGridDay,listMonth',
		},
		buttonText: {
			today: 'Today',
			dayGridMonth: 'Month',
			timeGridWeek: 'Week',
			timeGridDay: 'Day',
			listMonth: 'List',
		},
		eventContent: (info: any) => {
			const { type } = info.event.extendedProps;
			let icon = '●';
			if (type === 'task') icon = '☐';
			else if (type === 'event') icon = '📅';
			else if (type === 'meal') icon = '🍽';
			return { html: `<span>${icon} ${info.event.title}</span>` };
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

<!-- TODO: Allow filtering calendar items by user -->
<CalendarBase plugins={[TimeGrid, DayGrid, List, Interaction]} events={calendarEvents} {optionsOverride} />

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
