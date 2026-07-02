<script lang="ts">
	import Resources from '$partials/Resources.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Resource } from '$types/resources';


	let resources = $state<Resource[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleResources(res: any) {
				resources = res.resources ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'resources',
				onStale: handleResources,
				gqlQuery: `
					query {
						resources {
							name
							id
							category
							description
							image
							login
							url
							icon
						}
					}
				`,
			}).then(handleResources);
		}
	});
</script>

<svelte:head>
	<title>Reference | Kapers Crewe Household</title>
</svelte:head>

<h1>Reference</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<Resources {resources} />
{/if}
