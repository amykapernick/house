<script lang="ts">
	import TaskCard from '../Task/index.svelte';
	import type { Task, TaskStatus } from '$types/tasks';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		class: className = '',
	}: { tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();

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

<div class="{styles.board} {className}" style="

--columns: {columnCount}">
	{#each Object.entries(parsedTasks) as [status, statusTasks] (status)}
		<div class="column">
			<h2>{status}</h2>
			<ul class={styles.list}>
				{#each statusTasks as task (task.id)}
					<li class={styles.item}>
						<TaskCard {...task} {onUpdate} />
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
