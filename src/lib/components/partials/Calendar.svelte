<script lang="ts">
	import { Calendar, TimeGrid, DayGrid, List, Interaction } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import type { Task } from '$types/tasks';

	let {
		tasks = [],
		allDayEvents = [],
		icalEvents = [],
	}: {
		tasks: Task[];
		allDayEvents: any[];
		icalEvents: any[];
	} = $props();

	let calendarEvents = $derived.by(() => {
		const taskEvents = parseTasks(tasks);
		const calEvents = parseEvents(allDayEvents);
		const icsEvents = parseEvents(icalEvents);

		return [...taskEvents, ...calEvents, ...icsEvents].map((event) => ({
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
	});

	let options = $state({
		view: 'dayGridMonth',
		locale: 'en-AU',
		firstDay: 1,
		editable: true,
		selectable: true,
		events: [] as any[],
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
		nowIndicator: true,
		dayMaxEvents: true,
		slotDuration: '00:30',
		scrollTime: '08:00',
		eventContent: (info: any) => {
			const { type } = info.event.extendedProps;
			let icon = '●';
			if (type === 'task') icon = '☐';
			else if (type === 'event') icon = '📅';
			return { html: `<span>${icon} ${info.event.title}</span>` };
		},
		eventClick: (info: any) => {
			const link = info.event.extendedProps.link;
			if (link) window.open(link, '_blank');
		},
	});

	$effect(() => {
		options.events = calendarEvents;
	});
</script>

<div class="calendar-container">
	<Calendar plugins={[TimeGrid, DayGrid, List, Interaction]} {options} />
</div>

<style>
	.calendar-container {
		height: 80vh;

		:global(.ec) {
			font-family: inherit;
		}

		:global(.ec-toolbar) {
			flex-wrap: wrap;
			gap: 10px;
		}
	}
</style>
