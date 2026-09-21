<script lang="ts">
	import CalendarBase from './CalendarBase/index.svelte';
	import EventContent from './DayViewEventContent.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';
	import type { CalendarInstanceApi } from '@svar-ui/svelte-calendar';

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

	// SVAR's day view defaults to an 8am-6pm window (DayViewModel's own
	// `timeGrid` section) - the full 0-24 range is kept (via CalendarBase's
	// sectionOverrides, a documented deep-merge over the ViewModel's
	// getSections() output, same mechanism as the resources view's column
	// list) so every hour is reachable by scrolling, but the initial scroll
	// position below opens on 5am rather than midnight. `ui.minUnitHeight`
	// defaults to 100px/hour - too tall for a dashboard widget, so it's
	// shrunk to roughly 2em (HOUR_PX below - also used to compute the initial
	// scroll offset, so the two must stay in sync).
	const HOUR_PX = 32;
	const INITIAL_SCROLL_HOUR = 5;
	const sectionOverrides = { day: { timeGrid: { yScale: { startHour: 0, endHour: 24, ui: { minUnitHeight: HOUR_PX } } } } };

	const optionsOverride = {
		view: 'day',
		readonly: true,
		eventContent: EventContent,
		// Dashboard widget has no prev/next/today controls of its own left to
		// drive this (see the Switch above it for the one control it does keep),
		// so the built-in toolbar (Navigation.svelte) is switched off entirely
		// rather than just hidden with CSS.
		toolbar: null,
		// Fires once on mount (there's no way to navigate away from today with
		// the toolbar gone) - kept for parity with other CalendarBase callers
		// and in case a future control re-enables day navigation here.
		init: (api: CalendarInstanceApi) => {
			api.getReactiveState().visibleDateRange.subscribe((range) => {
				onDateChange?.(range.start);
			});

			// SVAR has no scroll-to-time API - the hour grid's scroll container
			// (".wx-sections") is found and nudged directly instead. `day_view`
			// (set below) is a stable, literal class - not scoped via a wrapper
			// element, since CalendarBase's own container needs to stay the
			// direct child of DayView's caller (the dashboard's own
			// `.calendar_card` wrapper depends on that direct parent/child
			// relationship for its subgrid). Only one DayView exists on the
			// page, so a plain global lookup is safe here. Its min-height
			// (driven by the same minUnitHeight above) is set synchronously
			// from static scale data, not gated behind the ResizeObserver-driven
			// "measured" state the grid content itself waits on, so the
			// scrollable height is already correct on the first frame - but a
			// rAF is still used to be safe against any layout not having
			// settled yet.
			requestAnimationFrame(() => {
				const scrollEl = document.querySelector<HTMLElement>('.day_view .wx-sections');
				if (scrollEl) scrollEl.scrollTop = INITIAL_SCROLL_HOUR * HOUR_PX;
			});
		},
	};
</script>

<CalendarBase
	class="day_view {className}"
	events={calendarEvents}
	views={['day']}
	{sectionOverrides}
	{optionsOverride}
/>
