<script lang="ts">
	import { startOfMonth } from 'date-fns';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { compareValues, type SortDirection } from '$utils/sortable';
	import monthlyAmount from '$utils/monthlyAmount';
	import { monthComparison } from '$utils/budgetSpendComparison';

	const PERIODS = [`Week`, `Fortnight`, `Month`, `Year`] as const;

	let {
		budget = $bindable([]),
		buckets = [],
		entries = [],
		income = false,
		editing = false,
		onChange,
		class: className = '',
	}: {
		budget: BudgetItem[];
		buckets?: BudgetBucket[];
		entries?: BudgetSpendEntry[];
		// Which slice of `budget` this instance shows/edits - income items or
		// expense items - so the same component can back both the Expenses and
		// Income tables on the budget page, each bound to the same underlying
		// array. New items added from this instance default to matching.
		income?: boolean;
		editing?: boolean;
		onChange?: () => void;
		class?: string;
	} = $props();

	const formatCurrency = (value: number) => value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

	// This month's actual spend per item, read-only regardless of edit mode -
	// there's no in-place way to edit actual spend here, that's what the
	// check-in modal is for. Income items have no actual-spend tracking, so
	// they're simply absent from the map (monthComparison excludes them).
	let thisMonthActualById = $derived.by(() => {
		const items = monthComparison(budget, buckets, entries, startOfMonth(new Date())).items;
		return new Map(items.map((item) => [item.id, item.actual]));
	});

	type SortKey = 'description' | 'bucket' | 'tags' | 'amount' | 'actual';

	let sortKey = $state<SortKey | null>(null);
	let sortDir = $state<SortDirection>('asc');

	function sortValue(item: BudgetItem, key: SortKey): string | number | null {
		switch (key) {
			case 'description':
				return item.description ?? '';
			case 'bucket':
				return item.bucket?.name ?? '';
			case 'tags':
				return item.tags ?? '';
			case 'amount':
				return item.monthlyAmount ?? 0;
			case 'actual':
				return thisMonthActualById.get(item.id) ?? null;
		}
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	let visibleItems = $derived(budget.filter((item) => !!item.income === income));

	// Sorting is disabled while editing so rows don't reorder under the user's
	// cursor mid-edit.
	let sorted = $derived.by(() => {
		if (!sortKey || editing) return visibleItems;
		return [...visibleItems].sort((a, b) => compareValues(sortValue(a, sortKey!), sortValue(b, sortKey!), sortDir));
	});

	function updateField<K extends 'description' | 'tags' | 'note' | 'income'>(id: string, field: K, value: BudgetItem[K]) {
		budget = budget.map((item) => (item.id === id ? { ...item, [field]: value } : item));
		onChange?.();
	}

	function updateAmount(id: string, amount: number, period: string) {
		budget = budget.map((item) => (item.id === id ? { ...item, amount, period, monthlyAmount: monthlyAmount(amount, period) ?? undefined } : item));
		onChange?.();
	}

	function updateBucket(id: string, bucketId: string) {
		const bucket = buckets.find((b) => b.id === bucketId) ?? undefined;
		budget = budget.map((item) => (item.id === id ? { ...item, bucket } : item));
		onChange?.();
	}

	function addItem() {
		budget = [
			...budget,
			{
				id: crypto.randomUUID(),
				description: '',
				amount: 0,
				period: 'Month',
				monthlyAmount: 0,
				income,
				bucket: undefined,
				tags: '',
				note: '',
			},
		];
		onChange?.();
	}

	function removeItem(id: string) {
		budget = budget.filter((item) => item.id !== id);
		onChange?.();
	}
</script>

{#snippet sortableHeader(key: SortKey, label: string, alignRight = false)}
	<th
		aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
		class:amount={alignRight}
	>
		<button
			type="button"
			onclick={() => toggleSort(key)}
		>
			{label}
			<span
				class="sort-icon"
				class:active={sortKey === key}
				aria-hidden="true"
			>
				{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
			</span>
		</button>
	</th>
{/snippet}

<div class={className}>
	<table class="budget">
		<thead>
			<tr>
				{@render sortableHeader('description', 'Description')}
				{@render sortableHeader('bucket', 'Bucket')}
				{@render sortableHeader('tags', 'Tags')}
				{@render sortableHeader('amount', 'Budgeted', true)}
				{#if !income}{@render sortableHeader('actual', 'Actual', true)}{/if}
				{#if editing}<th class="actions"></th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each sorted as { id, description, bucket, tags, monthlyAmount: amountPerMonth, income: itemIncome, amount, period } (id)}
				<tr data-income={itemIncome}>
					{#if editing}
						<td>
							<input
								type="text"
								value={description ?? ''}
								oninput={(e) => updateField(id, 'description', e.currentTarget.value)}
							/>
						</td>
						<td>
							<select
								value={bucket?.id ?? ''}
								onchange={(e) => updateBucket(id, e.currentTarget.value)}
							>
								<option value="">No bucket</option>
								{#each buckets as b (b.id)}<option value={b.id}>{b.name}</option>{/each}
							</select>
						</td>
						<td>
							<input
								type="text"
								value={tags ?? ''}
								oninput={(e) => updateField(id, 'tags', e.currentTarget.value)}
							/>
						</td>
						<td class="amount edit-amount">
							<input
								type="number"
								step="0.01"
								value={amount ?? 0}
								oninput={(e) => updateAmount(id, Number(e.currentTarget.value), period ?? 'Month')}
							/>
							<select
								value={period ?? 'Month'}
								onchange={(e) => updateAmount(id, amount ?? 0, e.currentTarget.value)}
							>
								{#each PERIODS as p (p)}<option value={p}>{p}ly</option>{/each}
							</select>
							<span class="income-toggle">
								<input
									type="checkbox"
									id="income-toggle-{id}"
									checked={itemIncome}
									onchange={(e) => updateField(id, 'income', e.currentTarget.checked)}
								/>
								<label for="income-toggle-{id}">Income</label>
							</span>
						</td>
						{#if !income}<td class="amount">{thisMonthActualById.has(id) ? formatCurrency(thisMonthActualById.get(id) ?? 0) : ''}</td>{/if}
						<td class="actions">
							<button
								type="button"
								onclick={() => removeItem(id)}
								aria-label="Remove {description || 'item'}">✕</button
							>
						</td>
					{:else}
						<td>{description}</td>
						<td>{bucket?.name}</td>
						<td>{tags}</td>
						<td class="amount">
							{itemIncome ? '+' : ''}{amountPerMonth != null ? amountPerMonth.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' }) : ''}
						</td>
						{#if !income}
							<td
								class="amount"
								data-over-budget={(thisMonthActualById.get(id) ?? 0) > (amountPerMonth ?? 0)}
							>
								{thisMonthActualById.has(id) ? formatCurrency(thisMonthActualById.get(id) ?? 0) : ''}
							</td>
						{/if}
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>

	{#if editing}
		<button
			type="button"
			class="add-item"
			onclick={addItem}>+ Add item</button
		>
	{/if}
</div>

<style>
	@import '@mixins';

	.budget {
		width: 100%;
		border-collapse: collapse;

		& th,
		& td {
			padding: 10px;
			border-bottom: 1px solid var(--grey_light);
			text-align: left;
		}

		& th {
			padding: 0;
			background: var(--navy);
			color: var(--navy_text);

			&.amount button {
				justify-content: flex-end;
			}

			&.actions {
				background: var(--navy);
			}
		}

		& tr[data-income='true'] td.amount {
			color: var(--green);
			font-weight: 600;
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
			background: color-mix(in oklch, var(--navy) 80%, var(--white_true));
		}
	}

	.sort-icon {
		opacity: 0.5;
		font-size: 0.75em;

		&.active {
			opacity: 1;
		}
	}

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.edit-amount {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em;

		& input[type='number'] {
			width: 7em;
		}

		& select {
			width: auto;
		}
	}

	.income-toggle {
		display: flex;
		align-items: center;
		gap: 0.3em;
		font-size: 0.85em;
		white-space: nowrap;

		& input {
			width: auto;
		}
	}

	.actions {
		text-align: center;

		& button {
			padding: 0.2em 0.5em;
			border: none;
			background: none;
			color: var(--red);
			font-size: 1.1em;
			cursor: pointer;
		}
	}

	.add-item {
		margin-top: 0.75em;

		@include button_secondary;
	}
</style>
