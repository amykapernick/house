<script lang="ts">
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import { bucketTotals } from '$utils/budgetTotals';
	import { compareValues, type SortDirection } from '$utils/sortable';

	let {
		buckets = $bindable([]),
		budget,
		editing = false,
		onChange,
		class: className = '',
	}: {
		buckets: BudgetBucket[];
		budget: BudgetItem[];
		editing?: boolean;
		onChange?: () => void;
		class?: string;
	} = $props();

	const formatCurrency = (value: number) =>
		value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

	let rows = $derived(bucketTotals(buckets, budget));

	let totals = $derived({
		percentage: rows.reduce((sum, row) => sum + (row.percentage ?? 0), 0),
		income: rows.reduce((sum, row) => sum + row.income, 0),
		expenses: rows.reduce((sum, row) => sum + row.expenses, 0),
	});

	type SortKey = 'name' | 'percentage' | 'income' | 'expenses';

	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<SortDirection>('asc');

	function sortValue(row: (typeof rows)[number], key: SortKey): string | number | null {
		switch (key) {
			case 'name': return row.name;
			case 'percentage': return row.percentage ?? 0;
			case 'income': return row.income;
			case 'expenses': return row.expenses;
		}
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else { sortKey = key; sortDir = 'asc'; }
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

{#snippet sortableHeader(key: SortKey, label: string, alignRight = false)}
	<th aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} class:amount={alignRight}>
		<button type="button" onclick={() => toggleSort(key)}>
			{label}
			<span class="sort-icon" class:active={sortKey === key} aria-hidden="true">
				{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
			</span>
		</button>
	</th>
{/snippet}

<table class="buckets {className}">
	<thead>
		<tr>
			{@render sortableHeader('name', 'Bucket')}
			{@render sortableHeader('percentage', 'Percentage', true)}
			{@render sortableHeader('income', 'Income', true)}
			{@render sortableHeader('expenses', 'Expenses', true)}
		</tr>
	</thead>
	<tbody>
		{#each sorted as { id, name, percentage, income, expenses } (id)}
			<tr>
				<td>{name}</td>
				{#if editing}
					<td class="amount edit-percentage">
						<input
							type="range" min="0" max="100" step="1" value={percentage ?? 0}
							oninput={(e) => updatePercentage(id, Number(e.currentTarget.value))}
						/>
						<input
							type="number" min="0" max="100" step="1" value={percentage ?? 0}
							oninput={(e) => updatePercentage(id, Number(e.currentTarget.value))}
						/>%
					</td>
				{:else}
					<td class="amount">{percentage != null ? `${percentage}%` : ''}</td>
				{/if}
				<td class="amount">{formatCurrency(income)}</td>
				<td class="amount" data-over-budget={expenses > income}>
					{expenses ? formatCurrency(expenses) : ''}
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
		</tr>
	</tfoot>
</table>

<style>
	.buckets {
		width: 100%;
		border-collapse: collapse;

		& th,
		& td {
			padding: 10px;
			text-align: left;
			border-bottom: 1px solid var(--grey_light);
		}

		& th {
			color: var(--navy_text);
			background: var(--navy);
			padding: 0;

			&.amount button {
				justify-content: flex-end;
			}
		}

		& tbody tr:nth-child(even) {
			background: var(--background);
			color: var(--background_text);
		}

		& tfoot td {
			border-bottom: none;
			border-top: 2px solid var(--grey);
			font-weight: 700;
		}

		& td[data-over-budget='true'] {
			color: var(--red);
			font-weight: 600;
		}
	}

	th button {
		display: flex;
		align-items: center;
		gap: 0.4em;
		width: 100%;
		padding: 10px;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		font-weight: inherit;
		text-align: inherit;
		cursor: pointer;

		&:hover {
			background: color-mix(in srgb, var(--navy) 80%, white);
		}
	}

	.sort-icon {
		font-size: 0.75em;
		opacity: 0.5;

		&.active {
			opacity: 1;
		}
	}

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.edit-percentage {
		display: flex;
		align-items: center;
		gap: 0.5em;

		& input[type='range'] {
			flex: 1;
			min-width: 6em;
		}

		& input[type='number'] {
			width: 4.5em;
		}
	}
</style>
