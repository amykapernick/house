<script lang="ts">
	import Resources from '$partials/Resources.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Resource } from '$types/resources';
	import type { Asset } from '$types/assets';
	import type { Supplier } from '$types/suppliers';
	import { getPageTitle } from '$utils/pageTitle';
	import Card from '$components/parts/resources/Card.svelte';

	let resources = $state<Resource[]>([]);
	let assets = $state<Asset[]>([]);
	let suppliers = $state<Supplier[]>([]);
	let resourcesLoading = $state(true);
	let assetsLoading = $state(true);
	let suppliersLoading = $state(true);

	// Fetched as three separate queries, not one combined query: fetchClientData
	// discards the *entire* response if any field in it errors, so bundling them
	// meant a slow/erroring assets fetch was blanking out resources and suppliers
	// too, even though those had resolved fine.
	$effect(() => {
		if ($isAuthenticated) {
			function handleResources(res: any) {
				resources = res.resources ?? [];
				resourcesLoading = false;
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
							archived
						}
					}
				`,
			}).then(handleResources);

			function handleAssets(res: any) {
				assets = res.assets ?? [];
				assetsLoading = false;
			}
			fetchClientData({
				cacheKey: 'assets',
				onStale: handleAssets,
				gqlQuery: `
					query {
						assets {
							name
							id
							icon
							content
							external
							category
							brand
							cost
							receipt
							dateOfPurchase
							ipAddress
							image
							macAddress
							model
							ramStorage
							status
						}
					}
				`,
			}).then(handleAssets);

			function handleSuppliers(res: any) {
				suppliers = res.suppliers ?? [];
				suppliersLoading = false;
			}
			fetchClientData({
				cacheKey: 'suppliers',
				onStale: handleSuppliers,
				gqlQuery: `
					query {
						suppliers {
							name
							id
							category
							archived
							url
							lastUsed
							email
							phone
						}
					}
				`,
			}).then(handleSuppliers);
		}
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Reference`)}</title>
</svelte:head>

<h1>Reference</h1>
{#if resourcesLoading || assetsLoading || suppliersLoading}
	<Skeleton rows={3} />
{/if}
<div class="references">
	{#if !resourcesLoading}
		<Resources items={resources} />
	{/if}
	{#if !assetsLoading}
		<Resources items={assets} />
	{/if}
	{#if !suppliersLoading}
		<Card
			items={suppliers}
			category="Suppliers"
		/>
	{/if}
</div>

<!-- TODO: Add archived section so it's there and searchable but not visible, hidden under details summary -->

<style>
	.references {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
		grid-auto-flow: row dense;

		:global(& > *:has(ul li:nth-child(4))) {
			grid-row-start: span 2;
		}

		:global(& > *:has(ul li:nth-child(8))) {
			grid-row-start: span 3;
		}

		:global(& > *:has(ul li:nth-child(12))) {
			grid-row-start: span 4;
		}

		:global(& > *:has(ul li:nth-child(16))) {
			grid-row-start: span 4;
		}

		:global(& > *:has(ul li:nth-child(20))) {
			grid-row-start: span 5;
		}

		:global(& > *:has(ul li:nth-child(24))) {
			grid-row-start: span 6;
		}
	}
</style>
