<script lang="ts">
	import { Segmented } from '@svar-ui/svelte-core';

	type CustomView = { name: string; text: string; onClick: () => void };
	type ViewOption = { id: string; label: string };

	// Registered under the 'calendarViews' toolbar comp (see index.svelte) in
	// place of SVAR's default 'modes' richselect dropdown - a single Segmented
	// row of buttons spanning both the built-in SVAR views (switched via
	// onSelectView, which index.svelte wires to api.exec('navigate-to', ...))
	// and the caller's customViews (Year/Timeline). customViews swap
	// CalendarBase out entirely (see index.svelte), so there's no "selected"
	// state to show for them here - only the built-in `value` highlights.
	let {
		value,
		views = [],
		customViews = [],
		onSelectView,
	}: {
		value?: string;
		views?: ViewOption[];
		customViews?: CustomView[];
		onSelectView?: (id: string) => void;
	} = $props();

	let options = $derived([...views, ...customViews.map((view) => ({ id: view.name, label: view.text }))]);

	function handleChange({ value: id }: { value: string | number }) {
		const customView = customViews.find((view) => view.name === id);
		if (customView) {
			customView.onClick();
			return;
		}
		onSelectView?.(String(id));
	}
</script>

<Segmented {options} {value} onchange={handleChange} />
