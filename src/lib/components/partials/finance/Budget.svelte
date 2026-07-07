<script lang="ts">
	import type { BudgetItem } from '$types/budget';
	import { monthlyAmount } from '$utils/budget';

	let { budget }: { budget: BudgetItem[] } = $props();
</script>

<table class="budget">
	<thead>
		<tr>
			<th>Description</th>
			<th>Bucket</th>
			<th>Tags</th>
			<th class="amount">Monthly Amount</th>
		</tr>
	</thead>
	<tbody>
		{#each budget as { id, description, bucket, tags, period, amount, income } (id)}
			{@const monthly = monthlyAmount(amount, period)}
			<tr data-income={income}>
				<td>{description}</td>
				<td>{bucket}</td>
				<td>{tags}</td>
				<td class="amount">
					{income ? '+' : ''}{monthly != null ? monthly.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' }) : ''}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.budget {
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

		& tr[data-income='true'] td.amount {
			color: var(--green);
			font-weight: 600;
		}
	}

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
