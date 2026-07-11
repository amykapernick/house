<script lang="ts">
	import { format } from 'date-fns';
	import { isAuthenticated } from '$lib/auth';
	import fetchTasksData from '$utils/tasksData';
	import { setCache } from '$utils/fetchClientData';
	import { notificationPermission, requestNotificationPermission } from '$utils/notifications';
	import TaskView from '$parts/tasks/TaskView.svelte';
	import type { Task, TaskStatus } from '$types/tasks';

	let tasks = $state<Task[]>([]);
	let loading = $state(true);
	let permission = $state(notificationPermission());

	async function enableReminders() {
		permission = await requestNotificationPermission();
	}

	$effect(() => {
		if ($isAuthenticated) {
			function handleTasks(data: Task[]) {
				tasks = data;
				loading = false;
			}
			fetchTasksData({ onStale: handleTasks }).then(handleTasks);
		}
	});

	// Keep the shared cache in sync so a revisit within the TTL doesn't show the pre-update status.
	function handleTaskUpdate(id: string, status: TaskStatus) {
		tasks = tasks.map((task) => (task.id === id ? { ...task, status } : task));
		setCache(`tasks-${format(new Date(), 'yyyy-MM-dd')}`, { tasks });
	}
</script>

<svelte:head>
	<title>Tasks | Kapers Crewe Household</title>
	<meta name="description" content="View all upcoming and overdue tasks in various views" />
</svelte:head>

<h1>Tasks</h1>
{#if permission !== `granted` && permission !== `unsupported`}
	<button class="enable_reminders" onclick={enableReminders}>Enable task reminders</button>
{/if}
{#if loading}
	<p>Loading...</p>
{:else}
	<TaskView {tasks} onUpdate={handleTaskUpdate} />
{/if}

<style>
	.enable_reminders {
		margin-bottom: 1em;
	}
</style>
