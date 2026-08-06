<script lang="ts">
	import { startOfMonth } from 'date-fns';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { bucketTotals } from '$utils/budgetTotals';
	import { monthComparison } from '$utils/budgetSpendComparison';
	import { compareValues, type SortDirection } from '$utils/sortable';
	import { formatCurrency } from '$utils/currency';
	import SortableTh from '$parts/SortableTh/index.svelte';
	import styles from './index.module.css';

	let {
		buckets = $bindable([]),
		budget,
		entries = [],
		editing = false,
		onChange,
		class: className = '',
	}: {
		buckets: BudgetBucket[];
		budget: BudgetItem[];
		entries?: BudgetSpendEntry[];
		editing?: boolean;
		onChange?: () => void;
		class?: string;
	} = $props();

	// This month's actual spend per bucket, read-only regardless of edit mode -
	// there's no in-place way to edit actual spend here, that's what the
	// check-in modal is for.
	let actualByBucketId = $derived.by(() => {
		const actualBuckets = monthComparison(budget, buckets, entries, startOfMonth(new Date())).buckets;
		return new Map(actualBuckets.map((bucket) => [bucket.id, bucket.actual]));
	});

	let rows = $derived(bucketTotals(buckets, budget).map((row) => ({ ...row, actual: actualByBucketId.get(row.id) ?? 0 })));

	let totals = $derived({
		percentage: rows.reduce((sum, row) => sum + (row.percentage ?? 0), 0),
		income: rows.reduce((sum, row) => sum + row.income, 0),
		expenses: rows.reduce((sum, row) => sum + row.expenses, 0),
		actual: rows.reduce((sum, row) => sum + row.actual, 0),
	});

	type SortKey = 'name' | 'percentage' | 'income' | 'expenses' | 'actual';

	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<SortDirection>('asc');

	function sortValue(row: (typeof rows)[number], key: SortKey): string | number | null {
		switch (key) {
			case 'name':
				return row.name;
			case 'percentage':
				return row.percentage ?? 0;
			case 'income':
				return row.income;
			case 'expenses':
				return row.expenses;
			case 'actual':
				return row.actual;
		}
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	// Sorting is disabled while editing so rows don't reorder under the user's
	// cursor mid-edit.
	let sorted = $derived.by(() => {
		if (!sortKey || editing) return rows;
		return [...rows].sort((a, b) => compareValues(sortValue(a, sortKey!), sortValue(b, sortKey!), sortDir));
	});

	function updatePercentage(id: string, percentage: number) {
		const clamped = Math.max(0, Math.min(100, percentage));
		buckets = buckets.map((bucket) => (bucket.id === id ? { ...bucket, percentage: clamped } : bucket));
		onChange?.();
	}
</script>

<table class="{styles.buckets} {className}">
	<thead>
		<tr>
			<SortableTh
				label="Bucket"
				active={sortKey === 'name'}
				direction={sortDir}
				onclick={() => toggleSort('name')}
			/>
			<SortableTh
				label="Percentage"
				active={sortKey === 'percentage'}
				direction={sortDir}
				alignRight
				onclick={() => toggleSort('percentage')}
			/>
			<SortableTh
				label="Income"
				active={sortKey === 'income'}
				direction={sortDir}
				alignRight
				onclick={() => toggleSort('income')}
			/>
			<SortableTh
				label="Expenses"
				active={sortKey === 'expenses'}
				direction={sortDir}
				alignRight
				onclick={() => toggleSort('expenses')}
			/>
			<SortableTh
				label="Actual"
				active={sortKey === 'actual'}
				direction={sortDir}
				alignRight
				onclick={() => toggleSort('actual')}
			/>
		</tr>
	</thead>
	<tbody>
		{#each sorted as { id, name, percentage, income, expenses, actual } (id)}
			<tr>
				<td>{name}</td>
				{#if editing}
					<td class="amount {styles['edit-percentage']}">
						<input
							type="range"
							min="0"
							max="100"
							step="1"
							value={percentage ?? 0}
							oninput={(e) => updatePercentage(id, Number(e.currentTarget.value))}
						/>
						<input
							type="number"
							min="0"
							max="100"
							step="1"
							value={percentage ?? 0}
							oninput={(e) => updatePercentage(id, Number(e.currentTarget.value))}
						/>%
					</td>
				{:else}
					<td class="amount">{percentage != null ? `${percentage}%` : ''}</td>
				{/if}
				<td class="amount">{formatCurrency(income)}</td>
				<td
					class="amount"
					data-over-budget={expenses > income}
				>
					{expenses ? formatCurrency(expenses) : ''}
				</td>
				<td
					class="amount"
					data-over-budget={actual > expenses}
				>
					{formatCurrency(actual)}
				</td>
			</tr>
		{/each}
	</tbody>
	<tfoot>
		<tr>
			<td>Grand Total</td>
			<td class="amount">{totals.percentage}%</td>
			<td class="amount">{formatCurrency(totals.income)}</td>
			<td class="amount">{formatCurrency(totals.expenses)}</td>
			<td class="amount">{formatCurrency(totals.actual)}</td>
		</tr>
	</tfoot>
</table>
