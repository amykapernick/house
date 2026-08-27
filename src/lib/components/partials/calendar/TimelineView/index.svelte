<script lang="ts">
	import { addDays, endOfWeek, format, startOfWeek } from 'date-fns';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import formatCalendarTitle from '$utils/calendar/formatCalendarTitle';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import type { Task } from '$types/tasks';
	import styles from './index.module.css';

	// One row per family member, time running horizontally across a week -
	// day-granularity bars (not an hour-level Gantt), the same simplification
	// tradeoff @svar-ui/svelte-calendar's free tier's scale primitives forced
	// (see CalendarBase/resourcesView.ts's comment) but chosen deliberately
	// here too since it reuses YearView's proven CSS-grid bar layout instead
	// of a bespoke pixel-based one. Referenced @event-calendar/core's
	// resource-timeline plugin (node_modules) for the overall row/bar shape,
	// not its layout code, which solves a harder (hour-level, overlap-stacking)
	// problem than this needs.
	type Resource = { id: string; title: string; colour?: string; textColour?: string };
	type TimelineEvent = {
		id: string;
		title: string;
		start: Date;
		end: Date;
		backgroundColor: string;
		textColor: string;
		extendedProps: { type: string; link?: string; status?: unknown; platform?: unknown };
		resourceIds: string[];
	};

	let {
		tasks = [],
		events = [],
		resources = [],
		weekStart = $bindable(startOfWeek(new Date(), { weekStartsOn: 1 })),
		title = $bindable(''),
		onRangeChange,
		onEventClick,
		onBack,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		resources: Resource[];
		weekStart?: Date;
		title?: string;
		onRangeChange?: (start: Date, end: Date) => void;
		onEventClick?: (event: { id: string; title: string; start: Date; end: Date; extendedProps?: Record<string, unknown> }) => void;
		onBack?: () => void;
		class?: string;
	} = $props();

	let weekEnd = $derived(endOfWeek(weekStart, { weekStartsOn: 1 }));
	let weekEndExclusive = $derived(addDays(weekEnd, 1));
	let days = $derived(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));

	let timelineEvents = $derived.by((): TimelineEvent[] => {
		const mapped = [...parseTasks(tasks), ...parseEvents(events)]
			.filter((event) => event.resource?.length)
			.map((event) => ({
				id: event.id,
				title: event.title,
				start: new Date(event.start),
				end: new Date(event.end),
				backgroundColor: 'colour' in event && event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
				textColor: 'colour' in event && event.colour ? `var(--${event.colour}_text)` : event.type === 'task' ? 'var(--purple_bright_text)' : 'var(--blue_text)',
				extendedProps: {
					type: event.type,
					link: 'link' in event ? event.link : undefined,
					status: 'status' in event ? event.status : undefined,
					platform: 'platform' in event ? event.platform : undefined,
				},
				resourceIds: event.resource!.map((member) => (member as { slug: string }).slug),
			}));

		// Guards against an id collision in the source data, same rationale as
		// YearView's own dedup (month.events there / rows here are keyed by id).
		return [...new Map(mapped.map((event) => [event.id, event])).values()];
	});

	function rowEvents(resourceId: string) {
		return timelineEvents
			.filter((event) => event.resourceIds.includes(resourceId) && event.end > weekStart && event.start < weekEndExclusive)
			.map((event) => {
				const clampedStart = event.start < weekStart ? weekStart : event.start;
				const clampedEnd = event.end > weekEndExclusive ? weekEndExclusive : event.end;
				const offset = Math.floor((clampedStart.getTime() - weekStart.getTime()) / 86_400_000);
				const span = Math.max(1, Math.ceil((clampedEnd.getTime() - clampedStart.getTime()) / 86_400_000));
				return { ...event, offset, span };
			});
	}

	$effect(() => {
		title = formatCalendarTitle(weekStart, weekEnd);
		onRangeChange?.(weekStart, weekEnd);
	});

	function prevWeek() {
		weekStart = addDays(weekStart, -7);
	}

	function nextWeek() {
		weekStart = addDays(weekStart, 7);
	}

	function goToday() {
		weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
	}
</script>

<div class="{styles.timeline_view} {className}">
	<div class="timeline-toolbar">
		<button
			type="button"
			onclick={prevWeek}
			aria-label="Previous week">Previous</button
		>
		<button
			type="button"
			onclick={goToday}>Today</button
		>
		<button
			type="button"
			onclick={nextWeek}
			aria-label="Next week">Next</button
		>
		<button
			type="button"
			onclick={onBack}>Back to Calendar</button
		>
	</div>
	<div
		class={styles.timeline}
		style={`--cols: ${days.length}`}
	>
		<span class={styles.corner}></span>
		{#each days as day, columnIndex (day.getTime())}
			<span
				class={styles.day_header}
				style={`--col-start: ${columnIndex + 2}`}
			>
				{format(day, DATE_FORMATS.weekdayShort)} {format(day, DATE_FORMATS.dayNumber)}
			</span>
		{/each}

		{#each resources as resource, rowIndex (resource.id)}
			<span
				class={styles.row_label}
				style={`--row: ${rowIndex + 2}`}
			>
				{resource.title}
			</span>
			<div
				class={styles.row}
				style={`--row: ${rowIndex + 2}`}
			>
				{#each rowEvents(resource.id) as event (event.id)}
					<button
						type="button"
						class={styles.event}
						style={`--col-start: ${event.offset + 1}; --col-end: span ${event.span}; --event_background: ${event.backgroundColor}; --event_colour: ${event.textColor}`}
						onclick={() => onEventClick?.(event)}
					>
						{event.title}
					</button>
				{/each}
			</div>
		{/each}

		{#if resources.length === 0}
			<p class={styles.empty}>No family members to show.</p>
		{/if}
	</div>
</div>
