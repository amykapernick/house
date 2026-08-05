<script lang="ts">
	import { TimeGrid, Interaction } from '@event-calendar/core';
	import CalendarBase from './CalendarBase.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';

	let {
		tasks = [],
		events = [],
		scheduleBlocks = [],
		colours = [],
		showSchedule = true,
		onDateChange,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		scheduleBlocks: ScheduleBlock[];
		colours?: PaletteColour[];
		showSchedule?: boolean;
		onDateChange?: (date: Date) => void;
		class?: string;
	} = $props();

	const DEFAULT_COLOUR_NAME = `purple_bright`;

	// Mirrors ScheduleView's own resolveColourName/textColourFor - every named
	// palette colour has a guaranteed AA-contrast _text pairing, so resolving
	// through the palette rather than guessing a raw hex's contrast is what
	// keeps this overlay accessible.
	function resolveColourName(colour: string | null): string {
		if (!colour) return DEFAULT_COLOUR_NAME;
		if (colours.some((c) => c.name === colour)) return colour;
		if (colour.startsWith(`#`)) {
			const match = colours.find((c) => c.hex?.toLowerCase() === colour.toLowerCase());
			if (match) return match.name;
		}
		return DEFAULT_COLOUR_NAME;
	}

	function textColourFor(colour: string | null): string {
		return `var(--${resolveColourName(colour)}_text)`;
	}

	let calendarEvents = $derived.by(() => {
		const items = [...parseTasks(tasks), ...parseEvents(events)].map((event) => ({
			id: event.id,
			title: event.title,
			start: new Date(event.start),
			end: new Date(event.end),
			allDay: event.allDay ?? false,
			backgroundColor: event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
			textColor: event.colour ? `var(--${event.colour}_text)` : event.type === 'task' ? 'var(--purple_bright_text)' : 'var(--blue_text)',
			extendedProps: { type: event.type },
		}));

		if (!showSchedule) return items;

		const blockEvents = scheduleBlocks.map((block) => ({
			id: `block-${block.id}`,
			title: block.label,
			start: new Date(block.start),
			end: new Date(block.end),
			allDay: false,
			backgroundColor: block.colour ? (block.colour.startsWith('#') ? block.colour : `var(--${block.colour})`) : `var(--${DEFAULT_COLOUR_NAME})`,
			textColor: textColourFor(block.colour),
			extendedProps: { type: 'block' },
		}));

		return [...items, ...blockEvents];
	});

	const optionsOverride = {
		view: 'timeGridDay',
		editable: false,
		selectable: false,
		slotMinTime: '06:00:00',
		slotMaxTime: '22:00:00',
		headerToolbar: { start: 'title', center: 'today,prev,next', end: '' },
		// Fires on every navigation (prev/next/today), not just the initial
		// mount - lets the dashboard refetch events/schedule for whichever day
		// is now visible instead of always showing "today"'s data.
		datesSet: (info: any) => {
			onDateChange?.(info.start);
		},
		eventContent: (info: any) => {
			const { type } = info.event.extendedProps;
			let icon = '●';
			if (type === 'task') icon = '☐';
			else if (type === 'event') icon = '📅';
			else if (type === 'block') icon = '';
			return { html: `<span>${icon ? `${icon} ` : ''}${info.event.title}</span>` };
		},
	};
</script>

<CalendarBase
	class="day_view {className}"
	plugins={[TimeGrid, Interaction]}
	events={calendarEvents}
	{optionsOverride}
/>
