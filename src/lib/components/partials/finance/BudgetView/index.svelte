<script lang="ts">
	import Budget from '$partials/finance/Budget/index.svelte';
	import BudgetBuckets from '$partials/finance/BudgetBuckets/index.svelte';
	import BudgetCharts from '$partials/finance/BudgetCharts/index.svelte';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import styles from './index.module.css';

	// The budget page's main view - overview charts, buckets, expenses and
	// income. Shared by the Budget tab (real data) and the Scratch Pad tab
	// (a scenario's copy), so both always have the same view/features.
	let {
		budget = $bindable([]),
		buckets = $bindable([]),
		entries = [],
		editing = false,
		onChange,
	}: {
		budget: BudgetItem[];
		buckets: BudgetBucket[];
		entries?: BudgetSpendEntry[];
		editing?: boolean;
		onChange?: () => void;
	} = $props();
</script>

<div class={styles.view}>
	<div class={styles.side}>
		<section class={styles.overview}>
			<h2>Overview</h2>
			<BudgetCharts {budget} {buckets} {entries} />
		</section>
		<section class={styles.buckets}>
			<h2>Buckets</h2>
			<BudgetBuckets bind:buckets {budget} {entries} {editing} {onChange} />
		</section>
		<section class={styles.income}>
			<h2>Income</h2>
			<Budget bind:budget {buckets} {entries} income={true} {editing} {onChange} />
		</section>
	</div>
	<section class={styles.expenses}>
		<h2>Expenses</h2>
		<Budget bind:budget {buckets} {entries} income={false} {editing} {onChange} />
	</section>
</div>
