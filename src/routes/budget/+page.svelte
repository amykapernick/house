<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import Budget from '$partials/finance/Budget.svelte';
	import BudgetBuckets from '$partials/finance/BudgetBuckets.svelte';
	import BudgetCharts from '$partials/finance/BudgetCharts.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';

	let budget = $state<BudgetItem[]>([]);
	let buckets = $state<BudgetBucket[]>([]);
	let loading = $state(true);

	const BUDGET_QUERY = `
		query {
			budget {
				id
				description
				amount
				period
				monthlyAmount
				income
				bucket {
					id
					name
				}
				tags
				note
			}
			budgetBuckets {
				id
				name
				percentage
				percentageGoal
				items {
					id
					monthlyAmount
					income
				}
			}
		}
	`;

	function handleBudget(res: any) {
		budget = res.budget ?? [];
		buckets = res.budgetBuckets ?? [];
		loading = false;
	}

	function loadBudget(skipCache = false) {
		fetchClientData({
			cacheKey: 'budget',
			skipCache,
			onStale: handleBudget,
			gqlQuery: BUDGET_QUERY,
		}).then(handleBudget);
	}

	$effect(() => {
		if ($isAuthenticated) loadBudget();
	});

	// Editing - editableBudget/editableBuckets are the working copy fed to the
	// tables/charts everywhere; they track budget/buckets (the server truth)
	// until the user starts changing them.
	function cloneBudget(items: BudgetItem[]): BudgetItem[] {
		return items.map((item) => ({ ...item, bucket: item.bucket ? { ...item.bucket } : undefined }));
	}
	function cloneBuckets(items: BudgetBucket[]): BudgetBucket[] {
		return items.map((bucket) => ({ ...bucket }));
	}

	let editableBudget = $state<BudgetItem[]>([]);
	let editableBuckets = $state<BudgetBucket[]>([]);
	let editing = $state(false);
	let dirty = $state(false);
	let saving = $state(false);
	let saveError = $state('');

	$effect(() => {
		editableBudget = cloneBudget(budget);
		editableBuckets = cloneBuckets(buckets);
		dirty = false;
	});

	function startEditing() {
		saveError = '';
		editing = true;
	}

	function discard() {
		if (dirty && !confirm('Discard unsaved budget changes?')) return;
		editableBudget = cloneBudget(budget);
		editableBuckets = cloneBuckets(buckets);
		dirty = false;
		saveError = '';
		editing = false;
	}

	const gqlStr = (value?: string | null) => JSON.stringify(value ?? '');
	const gqlBool = (value?: boolean | null) => (value ? 'true' : 'false');
	const gqlNum = (value?: number | null) => (value == null ? 'null' : String(value));

	function budgetItemInputGql(item: BudgetItem): string {
		return `{ description: ${gqlStr(item.description)}, amount: ${gqlNum(item.amount)}, period: ${gqlStr(item.period)}, income: ${gqlBool(item.income)}, bucket: ${item.bucket?.id ? gqlStr(item.bucket.id) : `null`}, tags: ${gqlStr(item.tags)}, note: ${gqlStr(item.note)} }`;
	}

	function budgetItemChanged(a: BudgetItem, b: BudgetItem): boolean {
		return (
			(a.description ?? '') !== (b.description ?? '')
			|| (a.amount ?? 0) !== (b.amount ?? 0)
			|| (a.period ?? '') !== (b.period ?? '')
			|| !!a.income !== !!b.income
			|| (a.bucket?.id ?? '') !== (b.bucket?.id ?? '')
			|| (a.tags ?? '') !== (b.tags ?? '')
			|| (a.note ?? '') !== (b.note ?? '')
		);
	}

	async function handleSave() {
		saving = true;
		saveError = '';

		const originalById = new Map(budget.map((item) => [item.id, item]));
		const editedIds = new Set(editableBudget.map((item) => item.id));

		const ops: string[] = [];
		let opCount = 0;

		for (const item of editableBudget) {
			const original = originalById.get(item.id);
			if (!original) {
				ops.push(`op${opCount++}: createBudgetItem(input: ${budgetItemInputGql(item)}) { success }`);
			}
			else if (budgetItemChanged(original, item)) {
				ops.push(`op${opCount++}: updateBudgetItem(id: ${gqlStr(item.id)}, input: ${budgetItemInputGql(item)}) { success }`);
			}
		}
		for (const item of budget) {
			if (!editedIds.has(item.id)) {
				ops.push(`op${opCount++}: deleteBudgetItem(id: ${gqlStr(item.id)}) { success }`);
			}
		}
		for (const bucket of editableBuckets) {
			const original = buckets.find((b) => b.id === bucket.id);
			if (original && (original.percentage ?? 0) !== (bucket.percentage ?? 0)) {
				ops.push(`op${opCount++}: updateBudgetBucketPercentage(id: ${gqlStr(bucket.id)}, percentage: ${gqlNum(bucket.percentage ?? 0)}) { success }`);
			}
		}

		if (!ops.length) {
			editing = false;
			saving = false;
			return;
		}

		try {
			const token = await getToken();
			const res = await fetch('/api/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ query: `mutation {\n${ops.join('\n')}\n}` }),
			}).then((r) => r.json());

			const results = Object.values(res?.data ?? {}) as { success?: boolean }[];
			if (res?.errors || !results.length || results.some((r) => !r?.success)) {
				throw new Error('Failed to save budget changes');
			}

			editing = false;
			loadBudget(true);
		}
		catch {
			saveError = 'Failed to save some changes - please try again.';
		}
		finally {
			saving = false;
		}
	}

	beforeNavigate(({ cancel }) => {
		if (dirty && !confirm('Discard unsaved budget changes?')) cancel();
	});

	$effect(() => {
		if (!dirty) return;

		function handler(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});
</script>

<svelte:head>
	<title>Budget | Kapers Crewe Household</title>
</svelte:head>

<h1>Budget</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<div class="budget-toolbar">
		{#if editing}
			{#if dirty}<span class="unsaved">Unsaved changes</span>{/if}
			<button type="button" onclick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
			<button type="button" onclick={discard} disabled={saving}>Discard</button>
			{#if saveError}<span class="error">{saveError}</span>{/if}
		{:else}
			<button type="button" onclick={startEditing}>Edit</button>
		{/if}
	</div>

	<h2>Overview</h2>
	<BudgetCharts budget={editableBudget} buckets={editableBuckets} />
	<h2>Buckets</h2>
	<BudgetBuckets bind:buckets={editableBuckets} budget={editableBudget} {editing} onChange={() => (dirty = true)} />
	<h2>Items</h2>
	<Budget bind:budget={editableBudget} buckets={editableBuckets} {editing} onChange={() => (dirty = true)} />
{/if}

<style>
	.budget-toolbar {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 1em;
	}

	.unsaved {
		color: var(--orange);
	}

	.error {
		color: var(--red);
	}
</style>
