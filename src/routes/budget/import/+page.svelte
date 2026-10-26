<script lang="ts">
	import BudgetImport from '$partials/finance/BudgetImport/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import Title from '$parts/Title/index.svelte';
	import { isAuthenticated } from '$lib/auth';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetRule } from '$types/budgetRule';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import fetchClientData, { clearCache } from '$utils/fetchClientData';
	import { getPageTitle } from '$utils/pageTitle';

	let budget = $state<BudgetItem[]>([]);
	let budgetSpend = $state<BudgetSpendEntry[]>([]);
	let rules = $state<BudgetRule[]>([]);
	let loading = $state(true);

	function handleData(res: any) {
		budget = res.budget ?? [];
		budgetSpend = res.budgetSpend ?? [];
		rules = res.budgetRules ?? [];
		loading = false;
	}

	function loadData(skipCache = false) {
		return fetchClientData({
			cacheKey: `budgetImport`,
			skipCache,
			onStale: handleData,
			gqlQuery: `
				query {
					budget {
						id
						description
						income
					}
					budgetSpend {
						id
						budgetItem
						weekStart
						amount
					}
					budgetRules {
						id
						field
						value
						budgetItem
						ignore
					}
				}
			`,
		}).then(handleData);
	}

	$effect(() => {
		if ($isAuthenticated) loadData();
	});

	function handleSaved() {
		// The main budget page caches the same spend data under its own key.
		clearCache(`budget`);
		loadData(true);
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Import Transactions`)}</title>
</svelte:head>

<Title>Import Transactions</Title>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<BudgetImport
		{budget}
		entries={budgetSpend}
		{rules}
		onRulesChanged={() => loadData(true)}
		onSaved={handleSaved}
	/>
{/if}
