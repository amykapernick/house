<script lang="ts">
	import TaskList from '../List/index.svelte';
	import TaskBoard from '../Kanban/index.svelte';
	import TaskCalendar from '../TaskCalendar/index.svelte';
	import SegmentedToggle from '$parts/SegmentedToggle/index.svelte';
	import taskDueBucket from '$utils/taskDueBucket';
	import { getTaskViewPreference, saveTaskViewPreference } from '$utils/taskViewPreference';
	import type { Task, TaskStatus } from '$types/tasks';
	import type { Component } from 'svelte';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		onTasksChanged,
		class: className = '',
	}: {
		tasks: Task[];
		onUpdate?: (id: string, status: TaskStatus) => void;
		onTasksChanged?: (tasks: Task[]) => void;
		class?: string;
	} = $props();

	type TaskViewType = 'list' | 'kanban' | 'calendar';
	type DueFilter = 'All' | 'Overdue' | 'Today' | 'This week';

	const views: Record<
		TaskViewType,
		{ component: Component<{ tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void }>; name: string }
	> = {
		list: {
			component: TaskList,
			name: 'List',
		},
		kanban: {
			component: TaskBoard,
			name: 'Kanban',
		},
		calendar: {
			component: TaskCalendar,
			name: 'Calendar',
		},
	};

	const viewOptions: { value: TaskViewType; label: string }[] = Object.entries(views).map(
		([value, { name }]) => ({ value: value as TaskViewType, label: name })
	);

	const dueFilterOptions: { value: DueFilter; label: string }[] = [
		{ value: 'All', label: 'All' },
		{ value: 'Overdue', label: 'Overdue' },
		{ value: 'Today', label: 'Today' },
		{ value: 'This week', label: 'This week' },
	];

	const saved = getTaskViewPreference();
	const savedView = viewOptions.find((option) => option.value === saved.view)?.value;
	const savedDueFilter = dueFilterOptions.find((option) => option.value === saved.dueFilter)?.value;

	let view = $state<TaskViewType>(savedView ?? 'calendar');
	let dueFilter = $state<DueFilter>(savedDueFilter ?? 'All');

	// Persists every change, including the fallback defaults above if nothing
	// was saved yet, so the next visit restores exactly what's showing now.
	$effect(() => {
		saveTaskViewPreference({ view, dueFilter });
	});

	let filteredTasks = $derived(
		dueFilter === 'All' ? tasks : tasks.filter((task) => taskDueBucket(task.due) === dueFilter)
	);
</script>

<div class={className}>
	<div class={styles.header}>
		<SegmentedToggle
			legend="Filter by due date"
			name="task-due-filter"
			bind:value={dueFilter}
			options={dueFilterOptions}
		/>
		<SegmentedToggle
			legend="View"
			name="task-view"
			bind:value={view}
			options={viewOptions}
		/>
	</div>
	{#if view === 'list'}
		<TaskList tasks={filteredTasks} {onUpdate} {onTasksChanged} />
	{:else if view === 'kanban'}
		<TaskBoard tasks={filteredTasks} {onUpdate} />
	{:else}
		<TaskCalendar tasks={filteredTasks} {onUpdate} />
	{/if}
</div>
