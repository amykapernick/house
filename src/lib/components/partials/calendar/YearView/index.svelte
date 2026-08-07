<script lang="ts">
	import { addDays, endOfYear, format, isSameDay, startOfWeek, startOfYear } from 'date-fns';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import buildYearMonths, { type YearViewEvent, type YearViewEventInput } from '$utils/calendar/buildYearMonths';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import type { Task } from '$types/tasks';
	import styles from './index.module.css';

	let {
		tasks = [],
		events = [],
		year = $bindable(new Date().getFullYear()),
		title = $bindable(''),
		onRangeChange,
		onEventClick,
		onBack,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		year?: number;
		title?: string;
		onRangeChange?: (start: Date, end: Date) => void;
		onEventClick?: (event: YearViewEvent) => void;
		onBack?: () => void;
		class?: string;
	} = $props();

	// Matches CalendarBase's firstDay: 1 (weeks start Monday) - derived from any
	// Monday rather than hardcoded, so it stays in sync with WEEK_OPTIONS in
	// buildYearMonths.ts if that ever changes.
	const weekdayLabels = Array.from({ length: 7 }, (_, i) => format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), DATE_FORMATS.weekdayShort));

	let yearEvents = $derived.by((): YearViewEventInput[] => {
		const mapped = [...parseTasks(tasks), ...parseEvents(events)]
			// Tasks clutter the year view unless they actually span multiple days -
			// a single-day task due date isn't worth a bar on a year-at-a-glance view.
			.filter((event) => event.allDay && (event.type !== 'task' || !isSameDay(event.start, event.end)))
			.map((event) => ({
				id: event.id,
				title: event.title,
				start: new Date(event.start),
				end: new Date(event.end),
				allDay: true,
				backgroundColor: 'colour' in event && event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
				textColor: 'colour' in event && event.colour ? `var(--${event.colour}_text)` : event.type === 'task' ? 'var(--purple_bright_text)' : 'var(--blue_text)',
				extendedProps: {
					type: event.type,
					link: 'link' in event ? event.link : undefined,
					status: 'status' in event ? event.status : undefined,
					platform: 'platform' in event ? event.platform : undefined,
				},
			}));

		// Guards against an id collision in the source data (e.g. a Home
		// Assistant calendar feed) - month.events is keyed by id, so a
		// duplicate would otherwise crash the each block's reconciliation.
		return [...new Map(mapped.map((event) => [event.id, event])).values()];
	});

	let months = $derived(buildYearMonths(year, yearEvents));

	// The weekday header repeats across as many day-columns as the widest month
	// needs (offset + its day count) - a month starting later in the week and/or
	// running 31 days needs more columns than a plain 7-day week.
	let headerDayColumns = $derived(Math.max(0, ...months.map((month) => month.offset + month.days.length)));

	$effect(() => {
		title = String(year);
		const yearStart = startOfYear(new Date(year, 0, 1));
		onRangeChange?.(yearStart, endOfYear(yearStart));
	});

	function prevYear() {
		year -= 1;
	}

	function nextYear() {
		year += 1;
	}

	function goToday() {
		year = new Date().getFullYear();
	}
</script>

<div class="{styles.year_view} {className}">
	<div class="year-toolbar">
		<button
			type="button"
			onclick={prevYear}
			aria-label="Previous year">Previous</button
		>
		<button
			type="button"
			onclick={goToday}>Today</button
		>
		<button
			type="button"
			onclick={nextYear}
			aria-label="Next year">Next</button
		>
		<button
			type="button"
			onclick={onBack}>Back to Calendar</button
		>
	</div>
	<div
		class={styles.year}
		style={`--cols: ${headerDayColumns}`}
	>
		{#each { length: headerDayColumns } as _, columnIndex (columnIndex)}
			<span
				class={styles.days}
				style={`--col-start: ${columnIndex + 1}`}
			>
				{weekdayLabels[columnIndex % 7]}
			</span>
		{/each}
		{#each months as month (month.index)}
			<h2
				class={styles.label}
				style={`--row: ${month.index}`}
			>
				{month.label}
			</h2>

			<div
				class={styles.month}
				style={`--row: ${month.index}; --col-start: ${month.offset + 1}; --col-end: span ${month.days.length + month.offset + 1}`}
			>
				{#each month.days as day (day.date.getTime())}
					<div
						class={[styles.day, day.isToday && 'today']}
						style={`--col-start: ${day.date.getDate()}`}
					>
						<span>{format(day.date, DATE_FORMATS.dayNumber)}</span>
					</div>
				{/each}

				{#each month.events as event (event.id + month.index)}
					<button
						type="button"
						class={styles.event}
						style={`--col-start: ${event.offset + 1}; --col-end: span ${event.span}; --event_background: ${event.backgroundColor}; --event_colour: ${event.textColor}`}
						onclick={() => onEventClick?.(event)}
						// TODO: add class of continues if the event continues into the next month, and continuing if it started in the previous month
					>
						{event.title}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>
