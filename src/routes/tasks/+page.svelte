<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isAuthenticated } from '$lib/auth';
	import fetchTasksData from '$utils/tasksData';
	import { setCache } from '$utils/fetchClientData';
	import { EVERYONE, isVisibleToUser } from '$utils/fetchFamilyMembers';
	import { notificationPermission, requestNotificationPermission } from '$utils/notifications';
	import { subscribeToPush } from '$utils/pushSubscription';
	import TaskView from '$parts/tasks/TaskView.svelte';
	import FamilyFilter from '$parts/FamilyFilter.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import type { Task, TaskStatus } from '$types/tasks';
	import { getPageTitle } from '$utils/pageTitle';

	let tasks = $state<Task[]>([]);
	let loading = $state(true);
	let permission = $state(notificationPermission());
	let selectedUserSlug = $state(EVERYONE);

	// The API resolves unassigned tasks, or tasks assigned to someone outside
	// the family, to the whole family - so `assigned` always includes every
	// member for an "everyone" task, and this filter needs no special case.
	let visibleTasks = $derived(tasks.filter((task) => isVisibleToUser(task.assigned, selectedUserSlug)));

	async function enableReminders() {
		permission = await requestNotificationPermission();
		if (permission === `granted`) await subscribeToPush();
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
		setCache(`tasks-${format(new Date(), DATE_FORMATS.iso)}`, { tasks });
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Tasks`)}</title>
	<meta name="description" content="View all upcoming and overdue tasks in various views" />
</svelte:head>

<h1>Tasks</h1>
{#if permission !== `granted` && permission !== `unsupported`}
	<button class="enable_reminders" onclick={enableReminders}>Enable task reminders</button>
{/if}
{#if loading}
	<Skeleton rows={3} />
{:else}
	<FamilyFilter bind:selectedUserSlug pageKey="tasks" />
	<TaskView tasks={visibleTasks} onUpdate={handleTaskUpdate} />
{/if}

<style>
	.enable_reminders {
		margin-bottom: 1em;
	}
</style>
