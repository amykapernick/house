<script lang="ts">
	import TaskList from './List.svelte';
	import TaskBoard from './Kanban.svelte';
	import TaskCalendar from './TaskCalendar.svelte';
	import type { Task } from '$types/tasks';
	import type { Component } from 'svelte';

	let { tasks = [] }: { tasks: Task[] } = $props();

	type TaskViewType = 'list' | 'kanban' | 'calendar';

	const views: Record<TaskViewType, { component: Component<{ tasks: Task[] }>; name: string }> = {
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

<div>
	<nav class="switcher">
		{#each Object.entries(views) as [viewType, { name }]}
			<button onclick={() => (view = viewType as TaskViewType)} data-active={view === viewType}>
				{name}
			</button>
		{/each}
	</nav>
	{#if view === 'list'}
		<TaskList {tasks} />
	{:else if view === 'kanban'}
		<TaskBoard {tasks} />
	{:else}
		<TaskCalendar {tasks} />
	{/if}
</div>

<style>
	.switcher {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		padding: 0.5em;
		gap: 10px;

		& button {
			&:not([data-active='true']) {
				--button_background: var(--neutral_light);
				--button_text: var(--purple_bright);
				--button_border: var(--purple_bright);
			}
		}
	}
</style>
