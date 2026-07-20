<script lang="ts">
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { bucketTotals, totalMonthlyExpenses, totalMonthlyIncome } from '$utils/budgetTotals';
	import { bucketExpenseTrend } from '$utils/budgetSpendComparison';
	import { categoricalColour, OTHER_LABEL, topNPlusOther } from '$utils/chartColours';
	import PieChart from '$components/parts/graph/PieChart.svelte';
	import BarChart from '$components/parts/graph/BarChart.svelte';
	import Stats from '$parts/Stats.svelte';

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

	const formatCurrency = (value: number) => value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
	const formatPercent = (value: number) => `${value.toFixed(0)}%`;

	const income = $derived(totalMonthlyIncome(budget));
	const expenses = $derived(totalMonthlyExpenses(budget));
	const net = $derived(income - expenses);

	const bucketRows = $derived(bucketTotals(buckets, budget));

	// Bucket split - target allocation of income across buckets, plus
	// whatever's left unassigned so the donut always reads as "of income".
	// Every bucket gets its own named slice - past the 7th, colours repeat
	// (grey_light onward) rather than merging real buckets into "Other".
	const bucketSlices = $derived.by(() => {
		const slices = bucketRows.filter((b) => b.percentage > 0).map((b, i) => ({ label: b.name, value: b.percentage, colour: categoricalColour(i) }));

		const allocated = bucketRows.reduce((sum, b) => sum + b.percentage, 0);
		const unallocated = 100 - allocated;
		if (unallocated > 0.5) slices.push({ label: 'Unallocated', value: unallocated, colour: 'grey' });

		return slices;
	});
	const totalAllocated = $derived(bucketRows.reduce((sum, b) => sum + b.percentage, 0));

	// Income vs expenses per bucket - what's allocated vs what's actually spent.
	const bucketBarGroups = $derived(
		bucketRows
			.filter((b) => b.income > 0 || b.expenses > 0)
			.map((b) => ({
				label: b.name,
				bars: [
					{ name: 'Allocated', colour: categoricalColour(1), value: b.income },
					{
						name: 'Spent',
						colour: categoricalColour(0),
						value: b.expenses,
						flag: b.expenses > b.income,
						flagLabel: 'over budget',
					},
				],
			})),
	);

	// Tag split - monthly spend grouped by the free-text, comma-separated tags
	// on each (non-income) budget item.
	/* eslint-disable svelte/prefer-svelte-reactivity -- `totals` is a scratch Map fully
	   consumed within this derivation; only the plain array built from it escapes. */
	const tagTotals = $derived.by(() => {
		const totals = new Map<string, number>();
		for (const item of budget) {
			if (item.income || !item.tags) continue;
			const amount = item.monthlyAmount ?? 0;
			if (amount <= 0) continue;
			for (const rawTag of item.tags.split(',')) {
				const tag = rawTag.trim();
				if (!tag) continue;
				totals.set(tag, (totals.get(tag) ?? 0) + amount);
			}
		}
		const raw = [...totals.entries()].map(([label, value]) => ({ label, value }));
		return topNPlusOther(raw, (value) => ({ label: OTHER_LABEL, value }), 9).sort((a, b) => b.value - a.value);
	});
	/* eslint-enable svelte/prefer-svelte-reactivity */
	const tagBarGroups = $derived(tagTotals.map((t) => ({ label: t.label, bars: [{ name: 'Spend', colour: categoricalColour(1), value: t.value }] })));

	// Actual spend trend per bucket, against that bucket's income/budgeted
	// reference figures - same shape as bucketBarGroups above but with Income
	// and Budgeted as fixed reference bars alongside one bar per time period,
	// flagged over-budget against that bucket's current budgeted figure.
	const now = new Date();
	const trendGroups = $derived(
		bucketExpenseTrend(budget, buckets, entries, now).map((bucket) => ({
			label: bucket.name,
			bars: [
				{ name: 'Income', colour: categoricalColour(0), value: bucket.income },
				{ name: 'Budgeted', colour: categoricalColour(1), value: bucket.budgeted },
				...bucket.periods.map((period, i) => ({
					name: period.label,
					colour: categoricalColour(i + 2),
					value: period.actual,
					flag: period.actual > bucket.budgeted,
					flagLabel: 'over budget',
				})),
			],
		})),
	);
</script>

<section class="charts {className}">
	<Stats
		items={[
			{ name: 'Monthly Income', value: formatCurrency(income), colour: 'blue_navy' },
			{ name: 'Monthly Expenses', value: formatCurrency(expenses), colour: 'purple_bright' },
			{ name: 'Net', value: formatCurrency(net), colour: net >= 0 ? 'green' : 'red' },
		]}
	/>

	<div class="grid">
		{#if bucketSlices.length}
			<figure>
				<PieChart
					slices={bucketSlices}
					formatValue={formatPercent}
					centerValue="{totalAllocated.toFixed(0)}%"
					centerLabel="Allocated"
				/>
				<figcaption>Bucket split (% of income)</figcaption>
			</figure>
		{/if}

		{#if bucketBarGroups.length}
			<figure>
				<BarChart
					groups={bucketBarGroups}
					formatValue={formatCurrency}
				/>
				<figcaption>Income vs expenses per bucket</figcaption>
			</figure>
		{/if}

		{#if tagBarGroups.length}
			<figure>
				<BarChart
					groups={tagBarGroups}
					formatValue={formatCurrency}
					orientation="horizontal"
				/>
				<figcaption>Monthly spend by tag</figcaption>
			</figure>
		{/if}

		{#if trendGroups.length}
			<figure>
				<BarChart
					groups={trendGroups}
					formatValue={formatCurrency}
				/>
				<figcaption>Actual expenses by bucket</figcaption>
			</figure>
		{/if}
	</div>
</section>

<style>
	.charts {
		margin-bottom: 2em;

		& :global(dl) {
			margin-bottom: 1.5em;
		}
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2em;

		@media (width >= 60em) {
			grid-template-columns: 1fr 1fr;
		}
	}

	figure {
		margin: 0;
		padding: 1em;
		border: 2px solid var(--navy);
	}

	figcaption {
		padding-top: 1em;
		font-style: italic;
		text-align: right;
	}
</style>
