<script lang="ts">
	import HouseMap from '$partials/HouseMap.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Area, Item } from '$types/house';


	let areas = $state<Area[]>([]);
	let items = $state<Item[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleHouse(res: any) {
				areas = res.areas ?? [];
				items = res.items ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'house',
				onStale: handleHouse,
				gqlQuery: `
					query {
						areas {
							name
							id
							start
							size
							link
							colour
							info {
								value
								type
							}
						}
						items {
							type
							state {
								type
								state
							}
							start
							size
							rotation
							link
							area {
								name
								id
								colour
							}
						}
					}
				`,
			}).then(handleHouse);
		}
	});
</script>

<svelte:head>
	<title>House | Kapers Crewe Household</title>
</svelte:head>

<h1>House</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<HouseMap {areas} {items} />
{/if}
