<script lang="ts">
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import { monthlyAmount } from '$utils/budget';

	let { buckets, budget }: { buckets: BudgetBucket[]; budget: BudgetItem[] } = $props();

	const formatCurrency = (value: number) =>
		value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

	let totalMonthlyIncome = $derived(
		budget
			.filter((item) => item.income)
			.reduce((sum, item) => sum + (monthlyAmount(item.amount, item.period) ?? 0), 0)
	);

	let rows = $derived(
		buckets.map((bucket) => {
			const expenses = budget
				.filter((item) => item.bucketId === bucket.id && !item.income)
				.reduce((sum, item) => sum + (monthlyAmount(item.amount, item.period) ?? 0), 0);

			return {
				...bucket,
				income: ((bucket.percentage ?? 0) / 100) * totalMonthlyIncome,
				expenses,
			};
		})
	);

	let totals = $derived({
		percentage: rows.reduce((sum, row) => sum + (row.percentage ?? 0), 0),
		income: rows.reduce((sum, row) => sum + row.income, 0),
		expenses: rows.reduce((sum, row) => sum + row.expenses, 0),
	});
</script>

<table class="buckets">
	<thead>
		<tr>
			<th>Bucket</th>
			<th class="amount">Percentage</th>
			<th class="amount">Income</th>
			<th class="amount">Expenses</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as { id, name, percentage, income, expenses } (id)}
			<tr>
				<td>{name}</td>
				<td class="amount">{percentage != null ? `${percentage}%` : ''}</td>
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
			color: var(--background);
			background: var(--navy);
		}

		& tbody tr:nth-child(even) {
			background: var(--background);
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

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
