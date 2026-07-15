<script lang="ts">
	import { Calendar } from '@event-calendar/core';
	import '@event-calendar/core/index.css';

	let {
		plugins,
		events = [],
		optionsOverride = {},
		class: className = '',
	}: {
		plugins: any[];
		events: any[];
		optionsOverride?: Record<string, any>;
		class?: string;
	} = $props();

	// optionsOverride is a static config object per caller, not a value that changes after mount
	// svelte-ignore state_referenced_locally
	let options = $state({
		locale: 'en-AU',
		firstDay: 1,
		nowIndicator: true,
		slotDuration: '00:30',
		scrollTime: '08:00',
		...optionsOverride,
		// @event-calendar/core (5.7.1) only defaults buttonText.today, leaving
		// prev/next unset - Buttons.svelte reads those directly for the
		// prev/next buttons' aria-label and title, so without this they render
		// as icon-only buttons with no accessible name. Merged (not spread
		// before optionsOverride) so a caller's own partial buttonText - e.g.
		// ScheduleView's { today: 'This Week' } - can't silently drop this.
		buttonText: { prev: 'Previous', next: 'Next', ...optionsOverride.buttonText },
		events: [] as any[],
	});

	$effect(() => {
		options.events = events;
	});
</script>

<!-- TODO: Look into resource calendar options for user and calendar -->

<div class="calendar-container {className}">
	<Calendar {plugins} {options} />
</div>

<style>
	.calendar-container {
		height: 80vh;

		:global(.ec) {
			font-family: inherit;
		}

		:global(.ec-toolbar) {
			flex-wrap: wrap;
			gap: 10px;
		}
	}
</style>
