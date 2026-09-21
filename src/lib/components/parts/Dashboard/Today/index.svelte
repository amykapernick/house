<script lang="ts">
	import { resolve } from '$app/paths';
	import Switch from '$parts/Switch/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import Panel from '$parts/Dashboard/Panel/index.svelte';
	import DayView from '$partials/calendar/DayView.svelte';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';
	import styles from './index.module.css';

	let {
		tasks,
		events,
		scheduleBlocks,
		colours,
		loading,
		onDateChange,
		class: className = '',
	}: {
		tasks: Task[];
		events: any[];
		scheduleBlocks: ScheduleBlock[];
		colours: PaletteColour[];
		loading: boolean;
		onDateChange?: (date: Date) => void;
		class?: string;
	} = $props();

	// Nothing outside this widget needs to know whether it's showing the
	// schedule or the calendar, so it's owned entirely here rather than
	// lifted to the dashboard page.
	let showSchedule = $state(true);
</script>

<Panel
	title="Today"
	class={className}
>
	{#snippet actions()}
		<Switch
			name="Schedule visibility"
			value={showSchedule ? 1 : 0}
			toggleFunction={(index) => (showSchedule = index === 1)}
			options={[{ label: 'Schedule' }, { label: 'Calendar' }]}
		/>
		<a
			class={styles.link}
			href={resolve(showSchedule ? '/schedule' : '/calendar')}>{showSchedule ? 'View schedule' : 'View calendar'}</a
		>
	{/snippet}

	{#if loading}
		<Skeleton rows={3} />
	{:else}
		<div class={styles['calendar-card']}>
			<DayView
				{tasks}
				{events}
				{scheduleBlocks}
				{colours}
				{showSchedule}
				{onDateChange}
			/>
		</div>
	{/if}
</Panel>
