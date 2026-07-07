<script lang="ts">
	import Budget from '$components/partials/finance/Budget.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { BudgetItem } from '$types/budget';

	let budget = $state<BudgetItem[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleBudget(res: any) {
				budget = res.budget ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'budget',
				onStale: handleBudget,
				gqlQuery: `
					query {
						budget {
							id
							description
							amount
							period
							income
							bucket
							tags
							note
						}
					}
				`,
			}).then(handleBudget);
		}
	});
</script>

<svelte:head>
	<title>Budget | Kapers Crewe Household</title>
</svelte:head>

<h1>Budget</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<Budget {budget} />
{/if}
