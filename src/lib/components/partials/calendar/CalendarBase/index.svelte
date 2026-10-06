<script lang="ts">
	import { Calendar, Willow } from '@svar-ui/svelte-calendar';
	import type { CalendarInstanceApi } from '@svar-ui/svelte-calendar';
	import { getToolbarItems } from '@svar-ui/calendar-store';
	import toSvarEvent, { type AppCalendarEvent } from '$utils/calendar/toSvarEvent';
	import eventColourClass from './eventColourClass';
	import './agendaView';
	import './resourcesView';
	import styles from './index.module.css';

	// month/week/day are native @svar-ui/svelte-calendar views. agenda/resources
	// are also genuine SVAR views, registered via agendaView.ts/resourcesView.ts's
	// ViewModel/registerCalendarView (a free, documented extension mechanism -
	// SVAR's *built-in* Agenda/Resources views are PRO-only, but this isn't
	// that; see CLAUDE.md's Calendar section). Year/Timeline aren't SVAR views
	// at all - they're fully custom components a caller swaps in for
	// CalendarBase entirely.
	type BuiltInView = 'month' | 'week' | 'day' | 'agenda' | 'resources';
	type Resource = { id: string; title: string };

	let {
		events = [],
		resources = [],
		views,
		sectionOverrides,
		optionsOverride = {},
		onApi,
		class: className = '',
	}: {
		events: AppCalendarEvent[];
		resources?: Resource[];
		views?: BuiltInView[];
		/** Per-view section overrides (eg. `{ day: { timeGrid: { yScale: { startHour: 0, endHour: 24 } } } }`),
		 * deep-merged into that view's own ViewModel.getSections() output - the same documented
		 * mechanism the `resources` view below uses for its column list, just generalised to any view. */
		sectionOverrides?: Record<string, Record<string, any>>;
		optionsOverride?: Record<string, any>;
		/** Hands the mounted calendar's api up to the caller - needed by any
		 * page-level control (nav/today/view-switcher) driving this instance
		 * from outside, since a fresh api only exists after mount and this
		 * component may remount (a caller swapping it out for Year/Timeline
		 * and back loses the old instance). */
		onApi?: (api: CalendarInstanceApi) => void;
		class?: string;
	} = $props();

	// Tracked locally (not just read from the caller's own currentView state,
	// e.g. +page.svelte's) so svarEvents below can react to it regardless of
	// which caller is driving this instance - DayView.svelte's dashboard
	// widget has no such state of its own at all.
	let currentSvarView = $state<string | undefined>();

	function handleInit(api: CalendarInstanceApi) {
		optionsOverride.init?.(api);
		onApi?.(api);
		api.getReactiveState().currentView.subscribe((view) => {
			currentSvarView = view;
		});
	}

	// The resource column list is injected via ViewConfig.sections (a documented
	// deep-merge over the registered ViewModel's own getSections() output, see
	// resourcesView.ts) rather than stored on the ViewModel instance - keeps it
	// reactive to family members loading in after first mount, since this
	// array is rebuilt (and re-fed to <Calendar views>) whenever `resources`
	// changes.
	let svarViews = $derived(
		(views ?? ['month', 'week', 'day']).map((name) => {
			if (name === 'resources') {
				// Both sections (the all-day row and the hourly grid below it -
				// see resourcesView.ts) are organised into the same per-resource
				// columns, so the injected column list applies to both.
				const items = resources.length ? resources.map((r) => ({ id: r.id, label: r.title })) : [{ id: '_none', label: '' }];
				return {
					id: 'resources',
					sections: {
						multiday: { xScale: { items } },
						resources: { xScale: { items } },
					},
				};
			}

			const override = sectionOverrides?.[name];
			return override ? { id: name, sections: override } : name;
		}),
	);

	// DiscreteScale (resourcesView.ts's xScale) resolves one column per event
	// via a single resourceId, so an event assigned to several family members
	// needs one copy per resourceId to show in each of their columns - giving
	// every other view (month/week/day/agenda, none of which key anything off
	// resourceId) the same duplicated entries would instead render the same
	// event on top of itself repeatedly there, so the explosion only happens
	// while Resources is actually the active view. Duplicates get a composite
	// id (SVAR's own event store is keyed by id) - extendedProps.eventId (see
	// +page.svelte's calendarEvents) carries the real id through for anything
	// downstream (eg. completing a task) that needs it.
	let svarEvents = $derived(
		currentSvarView === 'resources'
			? events.flatMap((event) => {
					const resourceIds = event.resourceIds?.length ? event.resourceIds : [undefined];
					return resourceIds.map((resourceId) => ({ ...toSvarEvent(event), id: resourceIds.length > 1 ? `${event.id}::${resourceId}` : event.id, resourceId }));
				})
			: events.map((event) => ({ ...toSvarEvent(event), resourceId: event.resourceIds?.[0] })),
	);

	// Every current caller drives nav/today/view-switching from its own
	// page-level controls (see +page.svelte/DayView.svelte's optionsOverride.
	// toolbar: null) rather than SVAR's own toolbar, so this default (SVAR's
	// stock items, minus the add-event button this app has no editor for) only
	// matters for a future caller that doesn't opt out.
	let toolbarItems = $derived(getToolbarItems().filter((item) => item.comp !== 'addEventButton'));

	// SVAR's eventCss returns a class name (not a style object, unlike
	// @event-calendar/core's eventDidMount) - see eventColourClass.ts. Merged
	// (not overwritten) so a caller's own eventCss can't silently drop this,
	// same defensive intent as the old eventDidMount merge.
	function eventCss(ctx: { event: any }): string {
		const base = eventColourClass(ctx.event.backgroundColor, ctx.event.textColor);
		const type = ctx.event.extendedProps?.type;
		const typeClass = type ? styles[`event-type-${type}`] : '';
		const extra = optionsOverride.eventCss?.(ctx) ?? '';
		return [base, typeClass, extra].filter(Boolean).join(' ');
	}
</script>

<div class="{styles.container} {className}">
	<!-- @svar-ui components read their look entirely from --wx-* custom
	     properties set by this theme wrapper - without it the calendar
	     renders with no colours/spacing at all, not just "unstyled" in the
	     plain-HTML sense. -->
	<Willow>
		<Calendar
			events={svarEvents}
			views={svarViews}
			view={optionsOverride.view}
			date={optionsOverride.date}
			readonly={optionsOverride.readonly ?? false}
			toolbar={optionsOverride.toolbar === undefined ? { items: toolbarItems } : optionsOverride.toolbar}
			eventContent={optionsOverride.eventContent}
			cellCss={optionsOverride.cellCss}
			{eventCss}
			init={handleInit}
		/>
	</Willow>
</div>
