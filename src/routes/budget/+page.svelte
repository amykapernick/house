<script lang="ts">
	import Budget from '$partials/finance/Budget.svelte';
	import BudgetBuckets from '$partials/finance/BudgetBuckets.svelte';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';

	let budget = $state<BudgetItem[]>([]);
	let buckets = $state<BudgetBucket[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleBudget(res: any) {
				budget = res.budget ?? [];
				buckets = res.budgetBuckets ?? [];
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
							bucketId
							bucket
							tags
							note
						}
						budgetBuckets {
							id
							name
							percentage
							percentageGoal
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
	<h2>Buckets</h2>
	<BudgetBuckets {buckets} {budget} />
	<h2>Items</h2>
	<Budget {budget} />
{/if}
