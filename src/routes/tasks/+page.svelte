<script lang="ts">
	import TaskView from '$parts/tasks/TaskView.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Task } from '$types/tasks';


	let tasks = $state<Task[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({

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
						}
					}
				`,
			}).then((res) => {
				tasks = res.tasks ?? [];
				loading = false;
			});
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
