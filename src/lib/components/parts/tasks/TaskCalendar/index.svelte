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

		[...tasks]
			.filter((task) => task.dueLabel)
			.sort((a, b) => (a.due < b.due ? -1 : 1))
			.forEach((task) => {
				const label = task.dueLabel as string;
				if (!grouped[label]) grouped[label] = [];
				grouped[label].push(task);
			});

		return grouped;
	});

	let columnCount = $derived(Object.keys(parsedTasks).length);
</script>

<div class="{styles.board} {className}" style="

--columns: {columnCount}">
	{#each Object.entries(parsedTasks) as [due, dueTasks] (due)}
		<div class="column">
			<h2>{due}</h2>
			<ul class={styles.list}>
				{#each dueTasks as task (task.id)}
					<li class={styles.item}>
						<TaskCard {...task} {onUpdate} />
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>
