<script lang="ts">
	import TaskCard from './Task.svelte';
	import type { Task } from '$types/tasks';

	let { tasks = [] }: { tasks: Task[] } = $props();

	let parsedTasks = $derived.by(() => {
		const grouped: Record<string, Task[]> = {};
		tasks.forEach((task) => {
			if (!grouped[task.status]) grouped[task.status] = [];
			grouped[task.status].push(task);
		});
		return grouped;
	});

	let columnCount = $derived(Object.keys(parsedTasks).length);
</script>

<div class="board" style="--columns: {columnCount}">
	{#each Object.entries(parsedTasks) as [status, statusTasks] (status)}
		<div class="column">
			<h2>{status}</h2>
			<ul class="list">
				{#each statusTasks as task (task.id)}
					<li class="item">
						<TaskCard {...task} />
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.board {
		gap: 10px;
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(100px, 1fr));
	}

	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.item {
		margin: 0.3em 0;
	}
</style>
