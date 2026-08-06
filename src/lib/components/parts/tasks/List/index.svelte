<script lang="ts">
	import TaskCard from '../Task/index.svelte';
	import type { Task, TaskStatus } from '$types/tasks';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		class: className = '',
	}: { tasks: Task[]; onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();
</script>

<ul class="{styles.list} {className}">
	{#each tasks as task (task.id)}
		<li class={styles.item}>
			<TaskCard {...task} {onUpdate} />
		</li>
	{/each}
</ul>
