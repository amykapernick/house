<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import { compareValues } from '$utils/sortable';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetSpendEntry } from '$types/budgetSpend';

	let {
		budget,
		entries,
		weekStart,
		onSaved,
		class: className = '',
	}: {
		budget: BudgetItem[];
		entries: BudgetSpendEntry[];
		weekStart: string;
		onSaved?: () => void;
		class?: string;
	} = $props();

	const formatCurrency = (value: number) => value.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

	// Existing entries for the week being checked in on, keyed by item id, so
	// each row's input starts pre-filled with whatever's already been logged -
	// re-opening the check-in page mid-week edits rather than duplicates.
	/* eslint-disable svelte/prefer-svelte-reactivity -- `map` is a scratch Map fully
	   built within this derivation; only reads of the finished map escape it. */
	let existingByItem = $derived.by(() => {
		const map = new Map<string, number>();
		for (const entry of entries) {
			if (entry.weekStart === weekStart && entry.budgetItem && entry.amount != null) map.set(entry.budgetItem, entry.amount);
		}
		return map;
	});
	/* eslint-enable svelte/prefer-svelte-reactivity */

	// Most recent weekStart logged against each item, across all weeks (not
	// just the one being checked in on) - used to float regularly-updated
	// items to the top of the list below.
	/* eslint-disable svelte/prefer-svelte-reactivity -- `map` is a scratch Map fully
	   built within this derivation; only reads of the finished map escape it. */
	let lastLoggedByItem = $derived.by(() => {
		const map = new Map<string, string>();
		for (const entry of entries) {
			if (!entry.budgetItem || !entry.weekStart) continue;
			const current = map.get(entry.budgetItem);
			if (!current || entry.weekStart > current) map.set(entry.budgetItem, entry.weekStart);
		}
		return map;
	});
	/* eslint-enable svelte/prefer-svelte-reactivity */

	let rows = $derived(
		budget
			.filter((item) => !item.income)
			.map((item) => ({
				id: item.id,
				description: item.description ?? '',
				bucketName: item.bucket?.name ?? 'No bucket',
				// Purely a display hint alongside the input - the periods-per-year
				// weekly equivalent of the budgeted monthly amount, same formula as
				// $utils/monthlyAmount, inverted. Not fed into the saved amount or
				// into the monthly comparison math.
				weeklyReference: ((item.monthlyAmount ?? 0) * 12) / 52,
				lastLogged: lastLoggedByItem.get(item.id) ?? null,
			}))
			// Items logged more recently sort first, so ones you update every week
			// stay near the top instead of buried among ones that never change;
			// compareValues treats a null lastLogged (never logged) as always-last
			// regardless of direction. Ties (including "never logged") fall back to
			// bucket then description for a stable order.
			.sort((a, b) => {
				const byRecency = compareValues(a.lastLogged, b.lastLogged, 'desc');
				return byRecency !== 0 ? byRecency : a.bucketName.localeCompare(b.bucketName) || a.description.localeCompare(b.description);
			})
	);

	let drafts = new SvelteMap<string, number>();
	let saving = new SvelteMap<string, boolean>();
	let saved = new SvelteMap<string, boolean>();
	let errors = new SvelteMap<string, string>();

	function draftValue(id: string): number {
		return drafts.get(id) ?? existingByItem.get(id) ?? 0;
	}

	function setDraft(id: string, value: number) {
		drafts.set(id, value);
		saved.delete(id);
	}

	async function save(id: string) {
		saving.set(id, true);
		saved.delete(id);
		errors.delete(id);

		const amount = draftValue(id);
		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { setBudgetSpend(budgetItem: "${id}", weekStart: "${weekStart}", amount: ${amount}) { success } }`,
			}),
		}).then((r) => r.json());

		saving.set(id, false);

		if (!res?.data?.setBudgetSpend?.success) {
			errors.set(id, "Couldn't save - try again.");
			return;
		}

		saved.set(id, true);
		onSaved?.();
	}
</script>

<div class={className}>
	<table class="check-in">
		<thead>
			<tr>
				<th>Item</th>
				<th>Bucket</th>
				<th class="amount">Weekly Ref.</th>
				<th class="amount">This Week's Actual</th>
				<th class="actions"></th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr>
					<td>{row.description}</td>
					<td>{row.bucketName}</td>
					<td class="amount">{formatCurrency(row.weeklyReference)}</td>
					<td class="amount">
						<input
							type="number"
							step="0.01"
							min="0"
							value={draftValue(row.id)}
							oninput={(e) => setDraft(row.id, Number(e.currentTarget.value))}
							aria-label="This week's actual spend for {row.description}"
						/>
					</td>
					<td class="actions">
						<button type="button" disabled={saving.get(row.id)} onclick={() => save(row.id)}>
							{saving.get(row.id) ? 'Saving…' : 'Save'}
						</button>
						{#if saved.get(row.id) && !saving.get(row.id)}<span class="saved">Saved</span>{/if}
						{#if errors.get(row.id)}<span class="error">{errors.get(row.id)}</span>{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	@import '@mixins';

	div {
		max-width: 100%;
		overflow-x: auto;
	}

	.check-in {
		width: 100%;
		border-collapse: collapse;

		& th,
		& td {
			padding: 10px;
			border-bottom: 1px solid var(--grey_light);
			text-align: left;
		}

		& th {
			background: var(--navy);
			color: var(--navy_text);

			&.amount {
				text-align: right;
			}
		}

		& tbody tr:nth-child(even) {
			background: var(--background);
			color: var(--background_text);
		}
	}

	.amount {
		text-align: right;
		font-variant-numeric: tabular-nums;

		& input {
			width: 7em;
			text-align: right;
		}
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;

		& button {

			@include button_secondary;
		}
	}

	.saved {
		color: var(--green);
		font-size: 0.85em;
	}

	.error {
		color: var(--red);
		font-size: 0.85em;
	}
</style>
