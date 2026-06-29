<script lang="ts">
	import TaskCard from './Task.svelte';
	import type { Task } from '$types/tasks';

	let { tasks = [] }: { tasks: Task[] } = $props();
</script>

<ul class="list">
	{#each tasks as task (task.id)}
		<li class="item">
			<TaskCard {...task} />
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
