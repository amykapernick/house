<script lang="ts">
	import { addHours, startOfDay, format } from 'date-fns';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import formatCalendarTitle from '$utils/calendar/formatCalendarTitle';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import type { Task } from '$types/tasks';
	import styles from './index.module.css';

	// One row per family member, a single day's 24 hours running horizontally -
	// events snap to whole-hour columns (Math.floor/ceil below), not true
	// minute-level positioning, the same discrete-grid-column simplification
	// YearView's day bars use, just at hour rather than day granularity.
	// Referenced @event-calendar/core's resource-timeline plugin (node_modules)
	// for the overall row/bar shape, not its layout code, which solves a
	// harder (overlap-stacking) problem than this needs.
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
		date = $bindable(startOfDay(new Date())),
		title = $bindable(''),
		onRangeChange,
		onEventClick,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		resources: Resource[];
		date?: Date;
		title?: string;
		onRangeChange?: (start: Date, end: Date) => void;
		onEventClick?: (event: { id: string; title: string; start: Date; end: Date; extendedProps?: Record<string, unknown> }) => void;
		class?: string;
	} = $props();

	let dayStart = $derived(startOfDay(date));
	let dayEnd = $derived(addHours(dayStart, 24));
	let hours = $derived(Array.from({ length: 24 }, (_, i) => addHours(dayStart, i)));

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
			.filter((event) => event.resourceIds.includes(resourceId) && event.end > dayStart && event.start < dayEnd)
			.map((event) => {
				const clampedStart = event.start < dayStart ? dayStart : event.start;
				const clampedEnd = event.end > dayEnd ? dayEnd : event.end;
				const offset = Math.floor((clampedStart.getTime() - dayStart.getTime()) / 3_600_000);
				const span = Math.max(1, Math.ceil((clampedEnd.getTime() - clampedStart.getTime()) / 3_600_000));
				return { ...event, offset, span };
			});
	}

	$effect(() => {
		title = formatCalendarTitle(date, date);
		onRangeChange?.(dayStart, dayEnd);
	});
</script>

<div class="{styles.timeline_view} {className}">
	<div
		class={styles.timeline}
		style={`--cols: ${hours.length}`}
	>
		<span class={styles.corner}></span>
		{#each hours as hour, columnIndex (hour.getTime())}
			<span
				class={styles.day_header}
				style={`--col-start: ${columnIndex + 2}`}
			>
				{format(hour, DATE_FORMATS.hour)}
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
