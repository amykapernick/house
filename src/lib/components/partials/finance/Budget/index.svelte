<script lang="ts">
	import { startOfMonth } from 'date-fns';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { compareValues, type SortDirection } from '$utils/sortable';
	import { formatCurrency } from '$utils/currency';
	import monthlyAmount from '$utils/monthlyAmount';
	import { monthComparison } from '$utils/budgetSpendComparison';
	import SortableTh from '$parts/SortableTh/index.svelte';
	import styles from './index.module.css';

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

<div class={className}>
	<table class={styles.budget}>
		<thead>
			<tr>
				<SortableTh
					label="Description"
					active={sortKey === 'description'}
					direction={sortDir}
					onclick={() => toggleSort('description')}
				/>
				<SortableTh
					label="Bucket"
					active={sortKey === 'bucket'}
					direction={sortDir}
					onclick={() => toggleSort('bucket')}
				/>
				<SortableTh
					label="Tags"
					active={sortKey === 'tags'}
					direction={sortDir}
					onclick={() => toggleSort('tags')}
				/>
				<SortableTh
					label="Budgeted"
					active={sortKey === 'amount'}
					direction={sortDir}
					alignRight
					onclick={() => toggleSort('amount')}
				/>
				{#if !income}
					<SortableTh
						label="Actual"
						active={sortKey === 'actual'}
						direction={sortDir}
						alignRight
						onclick={() => toggleSort('actual')}
					/>
				{/if}
				{#if editing}<th class={styles.actions}></th>{/if}
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
						<td class="amount {styles['edit-amount']}">
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
							<span class={styles['income-toggle']}>
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
						<td class={styles.actions}>
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
							{itemIncome ? '+' : ''}{amountPerMonth != null ? formatCurrency(amountPerMonth) : ''}
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
			class={styles['add-item']}
			onclick={addItem}>+ Add item</button
		>
	{/if}
</div>
