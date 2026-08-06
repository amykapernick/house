<script lang="ts">
	import TaskList from '../List/index.svelte';
	import TaskBoard from '../Kanban/index.svelte';
	import TaskCalendar from '../TaskCalendar/index.svelte';
	import type { Task, TaskStatus } from '$types/tasks';
	import type { Component } from 'svelte';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		class: className = '',
	}: { tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();

	type TaskViewType = 'list' | 'kanban' | 'calendar';

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

	let view = $state<TaskViewType>('calendar');
</script>

<div class={className}>
	<nav class={styles.switcher}>
		{#each Object.entries(views) as [viewType, { name }] (viewType)}
			<button onclick={() => (view = viewType as TaskViewType)} data-active={view === viewType}>
				{name}
			</button>
		{/each}
	</nav>
	{#if view === 'list'}
		<TaskList {tasks} {onUpdate} />
	{:else if view === 'kanban'}
		<TaskBoard {tasks} {onUpdate} />
	{:else}
		<TaskCalendar {tasks} {onUpdate} />
	{/if}
</div>
