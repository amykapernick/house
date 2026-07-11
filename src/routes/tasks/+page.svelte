<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchTasksData from '$utils/tasksData';
	import { notificationPermission, requestNotificationPermission } from '$utils/notifications';
	import TaskView from '$parts/tasks/TaskView.svelte';
	import type { Task } from '$types/tasks';

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
	<TaskView {tasks} />
{/if}

<style>
	.enable_reminders {
		margin-bottom: 1em;
	}
</style>
