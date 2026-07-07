<script lang="ts">
	import TaskCard from './Task.svelte';
	import { add, format, isBefore } from 'date-fns';
	import type { Task } from '$types/tasks';

	let { tasks = [] }: { tasks: Task[] } = $props();

	let parsedTasks = $derived.by(() => {
		const grouped: Record<string, Task[]> = {};
		const today = new Date();

		tasks
			.filter(({ due }) => due)
			.filter(({ due, status }) => !(status === 'Done' && isBefore(new Date(due), today)))
			.filter((task) => {
				const due = new Date(task.due);
				return isBefore(due, today) || isBefore(due, add(today, { days: 7 }));
			})
			.sort((a, b) => (isBefore(new Date(a.due), new Date(b.due)) ? -1 : 1))
			.forEach((task) => {
				const due =
					new Date(task.due) < today
						? 'Overdue'
						: format(new Date(task.due), 'dd-MMM-yyyy');
				if (!grouped[due]) grouped[due] = [];
				grouped[due].push(task);
			});

		return grouped;
	});

	let columnCount = $derived(Object.keys(parsedTasks).length);
</script>

<div class="board" style="--columns: {columnCount}">
	{#each Object.entries(parsedTasks) as [due, dueTasks] (due)}
		<div class="column">
			<h2>{due}</h2>
			<ul class="list">
				{#each dueTasks as task (task.id)}
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
