<script lang="ts">
	import TaskCard from './Task.svelte';
	import type { Task, TaskStatus } from '$types/tasks';

	let {
		tasks = [],
		onUpdate,
	}: { tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void } = $props();
</script>

<ul class="list">
	{#each tasks as task (task.id)}
		<li class="item">
			<TaskCard {...task} {onUpdate} />
		</li>
	{/each}
</ul>

<style>
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		margin: 0.3em 0;
	}
</style>
