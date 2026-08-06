<script lang="ts">
	import { startOfMonth, subMonths, format } from 'date-fns';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { monthComparison } from '$utils/budgetSpendComparison';
	import Stats from '$parts/Stats/index.svelte';

	let {
		budget,
		buckets,
		entries,
		class: className = '',
	}: {
		budget: BudgetItem[];
		buckets: BudgetBucket[];
		entries: BudgetSpendEntry[];
		class?: string;
	} = $props();

	const formatCurrency = (value: number) => value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

	const now = new Date();
	const thisMonthStart = startOfMonth(now);
	const lastMonthStart = startOfMonth(subMonths(now, 1));
	const thisMonthLabel = format(thisMonthStart, 'MMMM');
	const lastMonthLabel = format(lastMonthStart, 'MMMM');

	let thisMonth = $derived(monthComparison(budget, buckets, entries, thisMonthStart));
	let lastMonth = $derived(monthComparison(budget, buckets, entries, lastMonthStart));
</script>

<div class={className}>
	<Stats
		items={[
			{ name: `${thisMonthLabel} Budgeted`, value: formatCurrency(thisMonth.totalBudgeted), colour: 'blue_navy' },
			{ name: `${thisMonthLabel} Actual`, value: formatCurrency(thisMonth.totalActual), colour: 'purple_bright' },
			{ name: `${thisMonthLabel} Difference`, value: formatCurrency(thisMonth.totalDifference), colour: thisMonth.totalDifference > 0 ? 'red' : 'green' },
		]}
	/>
	<Stats
		items={[
			{ name: `${lastMonthLabel} Budgeted`, value: formatCurrency(lastMonth.totalBudgeted), colour: 'blue_navy' },
			{ name: `${lastMonthLabel} Actual`, value: formatCurrency(lastMonth.totalActual), colour: 'purple_bright' },
			{ name: `${lastMonthLabel} Difference`, value: formatCurrency(lastMonth.totalDifference), colour: lastMonth.totalDifference > 0 ? 'red' : 'green' },
		]}
	/>
</div>
