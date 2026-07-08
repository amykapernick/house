<script lang="ts">
	import { format } from 'date-fns';
	import TaskView from '$parts/tasks/TaskView.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Task } from '$types/tasks';


	let tasks = $state<Task[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleTasks(res: any) {
				tasks = res.tasks ?? [];
				loading = false;
			}
			const today = format(new Date(), 'yyyy-MM-dd');
			fetchClientData({
				cacheKey: `tasks-${today}`,
				onStale: handleTasks,
				gqlQuery: `
					query {
						tasks {
							id
							name
							assigned {
								name
								profile
							}
							status
							due
							dueLabel(today: "${today}")
						}
					}
				`,
			}).then(handleTasks);
		}
	});
</script>

<svelte:head>
	<title>Tasks | Kapers Crewe Household</title>
	<meta name="description" content="View all upcoming and overdue tasks in various views" />
</svelte:head>

<h1>Tasks</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<TaskView {tasks} />
{/if}
