<script lang="ts">
	import { Calendar, ResourceTimeGrid, ResourceTimeline } from '@event-calendar/core';
	import { format } from 'date-fns';
	import '@event-calendar/core/index.css';
	import { DATE_FORMATS } from '$utils/dateFormats';

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

<div class="calendar-container {className}">
	<Calendar
		plugins={allPlugins}
		{options}
	/>
</div>

<style>
	@import '@mixins';

	:global(.main > .layout.layout) {
		width: 100%;
		max-width: 1800px;
		margin-right: 0;
		margin-left: 0;
	}

	.calendar-container {
		& :global(.ec) {
			--ec-bg-color: var(--transparent);

			color: inherit;
			font: inherit;
		}

		& :global(.ec-main) {
			max-height: calc(100vh - 10em);
			border: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
			border-radius: 1em;
			box-shadow: var(--shadow_card);

			/* TODO: Style scrollbar */
		}

		& :global(.ec-title) {
			@include sr_only;
		}

		& :global(.ec-toolbar) {
			flex-wrap: wrap;
			justify-content: flex-end;
			font-size: 0.7em;
			gap: 10px;

			& :global(.ec-button-group) {
				display: flex;
				justify-content: start;
				width: max-content;
				overflow: hidden;
				border: 1px solid currentColor;
				border-radius: 0.5em;
				color: var(--purple_bright);
				gap: 0;

				& :global(.ec-button) {
					padding: 0.5em 1em;
					border: inherit;
					border-width: 0;
					background: var(--transparent);
					color: var(--purple_bright);
					color: inherit;
					font-size: 1em;
					font-weight: 600;
					cursor: pointer;
				}

				& :global(.ec-button.ec-active) {
					background: var(--purple_bright);
					color: var(--purple_bright_text);
				}

				& :global(.ec-button:not(:first-of-type)),
				& :global(.ec-button.ec-today) {
					border-left-width: 1px;
					border-radius: 0;
				}

				& :global(.ec-button:hover) {
					text-decoration: underline;
				}

				& :global(.ec-button:focus) {
					outline-offset: -2px;
				}

				& :global(.ec-prev) {
					order: -1;
				}
			}
		}

		& :global(.ec-header) {
			background: var(--page_bg);
		}

		& :global(:is(.ec-sidebar, .ec-col-head)) {
			@include subtitle;

			padding: 0.2em;
			font-size: 0.7em;
		}

		& :global(.ec-col-head) {
			& :global(.date) {
				display: block;
				color: var(--black);
				font-size: 1.4em;
			}
		}

		& :global(.ec-all-day .ec-sidebar) {
			color: var(--page_bg);
		}

		/* @event-calendar/core's time-grid views (week/day) have no built-in
		   cap on stacked all-day events, unlike the month view's dayMaxEvents
		   popup - so this row grows to fit every all-day event/task for the
		   day, pushing the time grid down. Cap it to ~4 rows and let the rest
		   scroll. Sized in em (not px) off each row's own layout - .ec-event's
		   title (1.5em against its 0.85em font) plus its padding/gap - so it
		   tracks the calendar's font-size rather than a fixed pixel guess. */

		& :global(.ec-all-day) {
			max-block-size: 7.6em;
			overflow: hidden auto;

			/* TODO: Style scrollbar */
		}

		& :global(.ec-event) {
			padding: 0.2em 0.4em;
			overflow: visible;
			background-color: var(--event_background, var(--ec-event-bg-color));
			color: var(--event_colour, var(--ec-event-text-color));

			& :global(.ec-event-body) {
				overflow: visible;
				border-radius: inherit;
				background: inherit;
			}

			& :global(.event) {
				position: relative;
				border-radius: inherit;
			}

			& :global(.ec-event-body .event::before) {
				content: '';
				position: absolute;
				z-index: -5;
				border-radius: inherit;
				opacity: 0.4;
				background: var(--event_background);
				inset: -0.2em -0.4em;
			}

			& :global(:is(.event, .task)) {
				display: flex;
				flex-wrap: wrap;
				align-items: center;

				& :global(.event-time) {
					order: 2;
				}

				& :global(.platform) {
					order: -1;
					margin-right: 0.6ch;
				}
			}
		}
	}

	@media (width >= 40em) {
		:global(.main > .layout.layout) {
			padding-right: 20px;
			padding-left: 20px;
		}
	}

	@media (height >= 900px) {
		:global(.main > .layout.layout) {
			overflow: hidden;
		}

		.calendar-container {
			& :global(.ec-main) {
				height: calc(100vh - 25em);
			}
		}
	}

	@media (width >= 50em) {
		:global(.main > .layout.layout) {
			padding-right: 20px;
			padding-left: 20px;
		}

		.calendar-container {
			& :global(.ec-toolbar) {
				position: absolute;
				top: 5.5em;
				right: 2em;
			}

			& :global(:is(.ec-sidebar, .ec-col-head)) {
				padding: 0.2em;
				font-size: 1em;
			}
		}

		@media (height >= 900px) {
			:global(.main > .layout.layout) {
				margin-bottom: 0;
				padding-bottom: 2em;
			}

			.calendar-container {
				& :global(.ec-main) {
					height: calc(100vh - 15em);
				}
			}
		}
	}

	@media (width >= 60em) {
		:global(.main > .layout.layout) {
			padding-right: 50px;
			padding-left: 50px;
		}
	}

	@media (width >= 70em) {
		.calendar-container {
			& :global(.ec-toolbar) {
				top: 4.5em;
				font-size: 0.8em;
			}
		}
	}

	@media (width >= 80em) {
		.calendar-container {
			& :global(.ec-toolbar) {
				top: 3.5em;
				font-size: 1em;
			}
		}
	}
</style>
