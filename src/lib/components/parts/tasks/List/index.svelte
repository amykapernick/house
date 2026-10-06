<script lang="ts">
	import TaskCard from '../Task/index.svelte';
	import taskDueBucket from '$utils/taskDueBucket';
	import type { DueBucket } from '$utils/taskDueBucket';
	import { createTask } from '$utils/createTask';
	import fetchTasksData from '$utils/tasksData';
	import { clearCache } from '$utils/fetchClientData';
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import type { Task, TaskStatus } from '$types/tasks';
	import styles from './index.module.css';

	let {
		tasks = [],
		onUpdate,
		onTasksChanged,
		class: className = '',
	}: {
		tasks: Task[];
		onUpdate?: (id: string, status: TaskStatus) => void;
		/** Called with the full, freshly-refetched task list after a task is added. */
		onTasksChanged?: (tasks: Task[]) => void;
		class?: string;
	} = $props();

	const BUCKET_ORDER: DueBucket[] = ['Overdue', 'Today', 'This week'];

	let grouped = $derived.by(() => {
		const groups: Record<DueBucket, Task[]> = { Overdue: [], Today: [], 'This week': [] };

		[...tasks]
			.sort((a, b) => (a.due < b.due ? -1 : 1))
			.forEach((task) => {
				const bucket = taskDueBucket(task.due);
				if (bucket) groups[bucket].push(task);
			});

		return groups;
	});

	let newTaskContent = $state('');
	let adding = $state(false);
	let addError = $state('');

	async function addTask(event: Event) {
		event.preventDefault();
		const content = newTaskContent.trim();
		if (!content || adding) return;

		adding = true;
		addError = '';

		const result = await createTask(content);

		if (!result.success) {
			adding = false;
			addError = "Couldn't add that task. Try again.";
			return;
		}

		newTaskContent = '';

		// The mutation only returns {success} - refetch for the new task's full
		// shape (id, status, assigned, etc.) rather than guessing it client-side.
		clearCache(`tasks-${format(new Date(), DATE_FORMATS.iso)}`);
		const fresh = await fetchTasksData();
		adding = false;
		onTasksChanged?.(fresh);
	}
</script>

<form class={styles.add_task} onsubmit={addTask}>
	<label class="sr-only" for="new-task-content">Add a task</label>
	<input
		id="new-task-content"
		type="text"
		placeholder="Add a task…"
		bind:value={newTaskContent}
		disabled={adding}
	/>
	<button type="submit" disabled={adding || !newTaskContent.trim()}>Add</button>
</form>
{#if addError}<p class={styles.error}>{addError}</p>{/if}

<div class="{styles.groups} {className}">
	{#each BUCKET_ORDER as bucket (bucket)}
		{#if grouped[bucket].length}
			<section>
				<h2 class={styles.heading} data-bucket={bucket.replaceAll(' ', '-').toLowerCase()}>
					{bucket}
					<span class={styles.count}>{grouped[bucket].length} task{grouped[bucket].length === 1 ? '' : 's'}</span>
				</h2>
				<ul class={styles.list}>
					{#each grouped[bucket] as task (task.id)}
						<li>
							<TaskCard {...task} dueBadge={bucket} {onUpdate} />
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/each}
</div>
