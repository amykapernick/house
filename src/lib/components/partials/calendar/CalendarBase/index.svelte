<script lang="ts">
	import { Calendar, Willow } from '@svar-ui/svelte-calendar';
	import { getToolbarItems } from '@svar-ui/calendar-store';
	import { registerToolbarItem } from '@svar-ui/svelte-toolbar';
	import { Button } from '@svar-ui/svelte-core';
	import toSvarEvent, { type AppCalendarEvent } from '$utils/calendar/toSvarEvent';
	import eventColourClass from './eventColourClass';
	import './agendaView';
	import './resourcesView';
	import styles from './index.module.css';

	// Module-level registries (registerToolbarItem/registerCalendarView, the
	// latter inside agendaView.ts/resourcesView.ts) only need to run once per
	// app load, not per CalendarBase instance - side effects at the top of a
	// .svelte <script> still only execute once since the module itself is
	// only evaluated once.
	registerToolbarItem('viewToggle', Button);

	// month/week/day are native @svar-ui/svelte-calendar views. agenda/resources
	// are also genuine SVAR views, registered via agendaView.ts/resourcesView.ts's
	// ViewModel/registerCalendarView (a free, documented extension mechanism -
	// SVAR's *built-in* Agenda/Resources views are PRO-only, but this isn't
	// that; see CLAUDE.md's Calendar section). Year/Timeline aren't SVAR views
	// at all - they're fully custom components a caller swaps in for
	// CalendarBase entirely (same pattern as the existing YearView), driven by
	// the customViews toolbar buttons below.
	type BuiltInView = 'month' | 'week' | 'day' | 'agenda' | 'resources';
	type CustomView = { name: string; text: string; onClick: () => void };
	type Resource = { id: string; title: string };

	let {
		events = [],
		resources = [],
		views,
		customViews,
		optionsOverride = {},
		class: className = '',
	}: {
		events: AppCalendarEvent[];
		resources?: Resource[];
		views?: BuiltInView[];
		customViews?: CustomView[];
		optionsOverride?: Record<string, any>;
		class?: string;
	} = $props();

	// The resource column list is injected via ViewConfig.sections (a documented
	// deep-merge over the registered ViewModel's own getSections() output, see
	// resourcesView.ts) rather than stored on the ViewModel instance - keeps it
	// reactive to family members loading in after first mount, since this
	// array is rebuilt (and re-fed to <Calendar views>) whenever `resources`
	// changes.
	let svarViews = $derived(
		(views ?? ['month', 'week', 'day']).map((name) => {
			if (name !== 'resources') return name;
			return {
				id: 'resources',
				sections: {
					resources: {
						xScale: {
							items: resources.length ? resources.map((r) => ({ id: r.id, label: r.title })) : [{ id: '_none', label: '' }],
						},
					},
				},
			};
		}),
	);

	// The Resources view only supports one resource column per event (see
	// resourcesView.ts) - an event assigned to multiple family members only
	// appears under the first.
	let svarEvents = $derived(events.map((event) => ({ ...toSvarEvent(event), resourceId: event.resourceIds?.[0] })));

	// Mirrors @event-calendar/core's customButtons mechanism: each customViews
	// entry becomes a toolbar button (via the 'viewToggle' comp registered
	// above) whose click swaps the whole calendar out for a caller-rendered
	// component, same as today's Year button. SVAR's own add-event button is
	// dropped since nothing renders its target (editorData) - this app uses
	// its own create/edit modals instead of @svar-ui/svelte-editor's form.
	let toolbarItems = $derived([
		...getToolbarItems().filter((item) => item.comp !== 'addEventButton'),
		...(customViews ?? []).map((view) => ({ id: view.name, comp: 'viewToggle', text: view.text, handler: view.onClick })),
	]);

	// SVAR's eventCss returns a class name (not a style object, unlike
	// @event-calendar/core's eventDidMount) - see eventColourClass.ts. Merged
	// (not overwritten) so a caller's own eventCss can't silently drop this,
	// same defensive intent as the old eventDidMount merge.
	function eventCss(ctx: { event: any }): string {
		const base = eventColourClass(ctx.event.backgroundColor, ctx.event.textColor);
		const extra = optionsOverride.eventCss?.(ctx) ?? '';
		return [base, extra].filter(Boolean).join(' ');
	}
</script>

<div class="{styles.container} {className}">
	<!-- @svar-ui components read their look entirely from --wx-* custom
	     properties set by this theme wrapper - without it the calendar
	     renders with no colours/spacing at all, not just "unstyled" in the
	     plain-HTML sense. Real theming/dark-mode is left for a follow-up
	     styling pass (see CLAUDE.md); this is the library's own default look. -->
	<Willow>
		<Calendar
			events={svarEvents}
			views={svarViews}
			view={optionsOverride.view}
			date={optionsOverride.date}
			readonly={optionsOverride.readonly ?? false}
			toolbar={optionsOverride.toolbar ?? { items: toolbarItems }}
			eventContent={optionsOverride.eventContent}
			cellCss={optionsOverride.cellCss}
			{eventCss}
			init={optionsOverride.init}
		/>
	</Willow>
</div>
