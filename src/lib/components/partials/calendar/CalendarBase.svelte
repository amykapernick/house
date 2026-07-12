<script lang="ts">
	import { Calendar } from '@event-calendar/core';
	import '@event-calendar/core/index.css';

	let {
		plugins,
		events = [],
		optionsOverride = {},
	}: {
		plugins: any[];
		events: any[];
		optionsOverride?: Record<string, any>;
	} = $props();

	// optionsOverride is a static config object per caller, not a value that changes after mount
	// svelte-ignore state_referenced_locally
	let options = $state({
		locale: 'en-AU',
		firstDay: 1,
		nowIndicator: true,
		slotDuration: '00:30',
		scrollTime: '08:00',
		// @event-calendar/core (5.7.1) only defaults buttonText.today, leaving
		// prev/next unset - Buttons.svelte reads those directly for the
		// prev/next buttons' aria-label and title, so without this they render
		// as icon-only buttons with no accessible name.
		buttonText: { prev: 'Previous', next: 'Next' },
		...optionsOverride,
		events: [] as any[],
	});

	$effect(() => {
		options.events = events;
	});
</script>

<!-- TODO: Look into resource calendar options for user and calendar -->

<div class="calendar-container">
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
