<script lang="ts">
	import { addDays, endOfYear, format, startOfWeek, startOfYear } from 'date-fns';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import buildYearMonths, { type YearViewEvent } from '$utils/calendar/buildYearMonths';
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

	let yearEvents = $derived.by((): YearViewEvent[] =>
		[...parseTasks(tasks), ...parseEvents(events)]
			.filter((event) => event.allDay)
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
			})),
	);

	let months = $derived(buildYearMonths(year, yearEvents));

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

<div class="year-view {className}">
	<div class="year-toolbar">
		<button type="button" onclick={prevYear} aria-label="Previous year">Previous</button>
		<button type="button" onclick={goToday}>Today</button>
		<button type="button" onclick={nextYear} aria-label="Next year">Next</button>
		<button type="button" onclick={onBack}>Back to Calendar</button>
	</div>
	<div class={styles['year-grid']}>
		{#each months as month (month.index)}
			<div class="month">
				<h2 class="month-name">{month.label}</h2>
				<div class={styles['weekday-row']}>
					{#each weekdayLabels as day (day)}
						<span class="weekday">{day}</span>
					{/each}
				</div>
				<div class={styles['day-grid']}>
					{#each month.weeks as week, weekIndex (weekIndex)}
						{#each week as cell, dayIndex (dayIndex)}
							<div class={['day-cell', cell.isToday && 'today', !cell.date && 'outside']}>
								{#if cell.date}
									<span class="day-number">{format(cell.date, DATE_FORMATS.dayNumber)}</span>
									{#each cell.events as event (event.id)}
										<button
											type="button"
											class={styles.event}
											style="

--event_background: {event.backgroundColor}; --event_colour: {event.textColor}"
											onclick={() => onEventClick?.(event)}
										>
											{event.title}
										</button>
									{/each}
								{/if}
							</div>
						{/each}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
