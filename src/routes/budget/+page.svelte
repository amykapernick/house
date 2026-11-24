<script lang="ts">
	import { format, startOfWeek, subWeeks, endOfWeek } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import BudgetView from '$partials/finance/BudgetView/index.svelte';
	import BudgetComparison from '$partials/finance/BudgetComparison.svelte';
	import BudgetCheckIn from '$partials/finance/BudgetCheckIn/index.svelte';
	import BudgetScratchPad from '$partials/finance/BudgetScratchPad/index.svelte';
	import Tabs from '$parts/Tabs/index.svelte';
	import Modal from '$parts/Modal/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl } from '$utils/fetchClientData';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';
	import { cloneBudget, cloneBuckets } from '$utils/budgetScenarios';

	const tabs = [
		{ id: 'budget', label: 'Budget' },
		{ id: 'tracking', label: 'Tracking' },
		{ id: 'scratch-pad', label: 'Scratch Pad' },
	];

	let activeTab = $state(tabs[0].id);

	$effect(() => {
		const hash = page.url.hash.slice(1);
		if (hash && tabs.some((t) => t.id === hash)) {
			activeTab = hash;
		}
	});

	function setActiveTab(id: string) {
		activeTab = id;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the hash
		goto(`${resolve('/budget')}#${id}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	let checkInOpen = $state(false);
	// Check-in logs the previous, already-completed Monday-Sunday week rather than the
	// still-in-progress current one, since actual spend for this week isn't final yet.
	const previousWeekStart = subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
	const previousWeekStartIso = format(previousWeekStart, DATE_FORMATS.iso);
	const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 });

	let budget = $state<BudgetItem[]>([]);
	let buckets = $state<BudgetBucket[]>([]);
	let budgetSpend = $state<BudgetSpendEntry[]>([]);
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
			budgetSpend {
				id
				budgetItem
				weekStart
				amount
			}
		}
	`;

	function handleBudget(res: any) {
		budget = res.budget ?? [];
		buckets = res.budgetBuckets ?? [];
		budgetSpend = res.budgetSpend ?? [];
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
			const res = await fetch(getGraphqlUrl(), {
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
	<title>{getPageTitle(`Budget`)}</title>
</svelte:head>

<Title>Budget</Title>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<Tabs
		{tabs}
		active={activeTab}
		onSelect={setActiveTab}
	/>

	{#if activeTab === 'budget'}
		<div
			id="panel-budget"
			role="tabpanel"
			aria-labelledby="tab-budget"
			tabindex="0"
		>
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

			<BudgetView bind:budget={editableBudget} bind:buckets={editableBuckets} entries={budgetSpend} {editing} onChange={() => (dirty = true)} />
		</div>
	{/if}

	{#if activeTab === 'tracking'}
		<div
			id="panel-tracking"
			role="tabpanel"
			aria-labelledby="tab-tracking"
			tabindex="0"
		>
			<div class="budget-toolbar">
				<button type="button" onclick={() => (checkInOpen = true)}>Log last week's spend</button>
				<a href={resolve('/budget/import')}>Import transactions</a>
			</div>

			<h2>Actual vs Budget</h2>
			<BudgetComparison budget={budget} buckets={buckets} entries={budgetSpend} />
		</div>
	{/if}

	{#if activeTab === 'scratch-pad'}
		<div
			id="panel-scratch-pad"
			role="tabpanel"
			aria-labelledby="tab-scratch-pad"
			tabindex="0"
		>
			<BudgetScratchPad {budget} {buckets} entries={budgetSpend} />
		</div>
	{/if}

	<Modal bind:open={checkInOpen} title="Budget Check-in">
		<p class="week-label">
			Week of {format(previousWeekStart, DATE_FORMATS.short)} - {format(previousWeekEnd, DATE_FORMATS.short)}
		</p>
		<BudgetCheckIn budget={budget} entries={budgetSpend} weekStart={previousWeekStartIso} onSaved={() => loadBudget(true)} />
	</Modal>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
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

	.week-label {
		margin-top: 0;
		color: var(--grey);
	}
</style>
