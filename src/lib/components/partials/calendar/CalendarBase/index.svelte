<script lang="ts">
	import { Calendar, ResourceTimeGrid, ResourceTimeline } from '@event-calendar/core';
	import { format } from 'date-fns';
	import '@event-calendar/core/index.css';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import styles from './index.module.css';

	let {
		plugins,
		events = [],
		resources = [],
		optionsOverride = {},
		class: className = '',
	}: {
		plugins: any[];
		events: any[];
		resources?: any[];
		optionsOverride?: Record<string, any>;
		class?: string;
	} = $props();

	// ResourceTimeGrid/ResourceTimeline are always available so any caller can
	// switch into a resourceTimelineWeek/resourceTimeGridDay view (e.g. a
	// per-person or per-calendar-source column) just by setting optionsOverride.view
	// and optionsOverride.resources, without also having to remember to import
	// and pass the plugins themselves.
	let allPlugins = $derived([...new Set([...plugins, ResourceTimeGrid, ResourceTimeline])]);

	// optionsOverride is a static config object per caller, not a value that changes after mount
	// svelte-ignore state_referenced_locally
	let options = $state({
		locale: 'en-AU',
		firstDay: 1 as const,
		nowIndicator: true,
		slotDuration: '00:30',
		scrollTime: '08:00',
		// Patched into @event-calendar/core (patches/@event-calendar+core+*.patch) -
		// the upstream DayHeader component only ever rendered a single Intl-formatted
		// string, with no hook to split it into separately-styled parts.
		dayHeaderContent: (arg: { date: Date }) => ({ html: `<span class="day">${format(arg.date, DATE_FORMATS.weekdayShort)}</span> <span class="date">${format(arg.date, DATE_FORMATS.dayNumber)}</span>` }),
		...optionsOverride,
		// @event-calendar/core (5.7.1) only defaults buttonText.today, leaving
		// prev/next unset - Buttons.svelte reads those directly for the
		// prev/next buttons' aria-label and title, so without this they render
		// as icon-only buttons with no accessible name. Merged (not spread
		// before optionsOverride) so a caller's own partial buttonText - e.g.
		// ScheduleView's { today: 'This Week' } - can't silently drop this.
		buttonText: { prev: 'Previous', next: 'Next', ...optionsOverride.buttonText },
		// BaseEvent.svelte applies backgroundColor/textColor as a literal inline
		// background-color/color style on .ec-event itself, not as the
		// --event_background/--event_colour custom properties the stylesheet
		// below expects - so the .event::before halo (which can only read a
		// custom property, since generated content has no element to inherit
		// a plain property from) never had a value to read. Mirrors those same
		// per-event colours into custom properties here instead. Merged (not
		// spread before optionsOverride) so a caller's own eventDidMount -
		// none currently set one, but the buttonText precedent above shows why
		// this matters - can't silently drop this.
		eventDidMount: (info: any) => {
			optionsOverride.eventDidMount?.(info);
			const { backgroundColor, textColor } = info.event;
			if (backgroundColor) info.el.style.setProperty('--event_background', backgroundColor);
			if (textColor) info.el.style.setProperty('--event_colour', textColor);
		},
		events: [] as any[],
		resources: [] as any[],
	});

	$effect(() => {
		options.events = events;
		options.resources = resources;
	});
</script>

<div class="{styles.container} {className}">
	<Calendar
		plugins={allPlugins}
		{options}
	/>
</div>
