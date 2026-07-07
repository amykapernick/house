<script lang="ts">
	import { TimeGrid, DayGrid, List, Interaction } from '@event-calendar/core';
	import { parseISO, setHours } from 'date-fns';
	import CalendarBase from './CalendarBase.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import type { Task } from '$types/tasks';

	let {
		tasks = [],
		allDayEvents = [],
		icalEvents = [],
		mealPlans = [],
	}: {
		tasks: Task[];
		allDayEvents: any[];
		icalEvents: any[];
		mealPlans: any[];
	} = $props();

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
			const { link, type } = info.event.extendedProps;
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
