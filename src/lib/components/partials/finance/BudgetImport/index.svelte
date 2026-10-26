<script lang="ts">
	import { format, parseISO, endOfWeek } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import Select from '$parts/Select/index.svelte';
	import { getToken } from '$lib/auth';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetRule, BudgetRuleField } from '$types/budgetRule';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import { autoAssign, parseTransactions, transactionValues, weeklyTotals, type Assignment, type BankTransaction } from '$utils/budgetImport';
	import { formatCurrency } from '$utils/currency';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import styles from './index.module.css';

	let {
		budget,
		entries,
		rules,
		onRulesChanged,
		onSaved,
	}: {
		budget: BudgetItem[];
		entries: BudgetSpendEntry[];
		rules: BudgetRule[];
		onRulesChanged: () => Promise<void>;
		onSaved?: () => void;
	} = $props();

	const IGNORE = `__ignore`;
	const FIELD_LABELS: Record<BudgetRuleField, string> = { payee: `Payee`, category: `Category`, tag: `Tag` };

	let expenseItems = $derived(budget.filter((item) => !item.income).sort((a, b) => (a.description ?? ``).localeCompare(b.description ?? ``)));
	let itemOptions = $derived([
		{ value: ``, label: `Unassigned` },
		{ value: IGNORE, label: `Ignore` },
		...expenseItems.map((item) => ({ value: item.id, label: item.description ?? `` })),
	]);
	let itemNames = $derived(new Map(budget.map((item) => [item.id, item.description ?? ``])));

	// The CSV is only ever held in memory - nothing about the raw transactions is saved,
	// just the weekly totals (and any rules) once you choose to.
	let transactions = $state<BankTransaction[]>([]);
	let fileError = $state(``);
	let overrides = new SvelteMap<string, Assignment>();

	async function handleFile(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (!file) return;
		overrides.clear();
		try {
			transactions = parseTransactions(await file.text()).sort((a, b) => a.date.getTime() - b.date.getTime());
			fileError = ``;
		}
		catch (error) {
			transactions = [];
			fileError = `Couldn't read that file - ${(error as Error).message}`;
		}
	}

	const assign = (transaction: BankTransaction) => overrides.get(transaction.id) ?? autoAssign(transaction, rules);
	const assignmentValue = (assignment: Assignment) => (assignment.ignore ? IGNORE : assignment.budgetItem ?? ``);

	function setAssignment(transaction: BankTransaction, value: string) {
		overrides.set(transaction.id, { budgetItem: value && value !== IGNORE ? value : null, ignore: value === IGNORE });
	}

	let totals = $derived(weeklyTotals(transactions, assign));
	let weeks = $derived(
		[...Map.groupBy(transactions, (transaction) => transaction.weekStart)]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([weekStart, weekTransactions]) => ({
				weekStart,
				transactions: weekTransactions,
				unassigned: weekTransactions.filter((t) => { const a = assign(t); return !a.ignore && !a.budgetItem; }).length,
				totals: [...(totals.get(weekStart) ?? [])].sort(([a], [b]) => (itemNames.get(a) ?? ``).localeCompare(itemNames.get(b) ?? ``)),
			}))
	);

	const loggedAmount = (weekStart: string, budgetItem: string) =>
		entries.find((entry) => entry.weekStart === weekStart && entry.budgetItem === budgetItem)?.amount;

	async function gql(query: string, variables: Record<string, unknown>) {
		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query, variables }),
		}).then((r) => r.json());

		const results = Object.values(res?.data ?? {}) as { success?: boolean }[];
		if (res?.errors || !results.length || results.some((r) => !r?.success)) throw new Error(`Request failed`);
	}

	// "Remember" options for a row: one per payee/tag/category value it has. The
	// select's value reflects whichever saved rule (if any) categorised it.
	function ruleOptions(transaction: BankTransaction) {
		const fields: BudgetRuleField[] = [`payee`, `tag`, `category`];
		return [
			{ value: ``, label: `Just this one` },
			...fields.flatMap((field) => transactionValues(transaction, field).map((value) => ({
				value: `${field}:${value}`,
				label: `${FIELD_LABELS[field]}: ${value}`,
			}))),
		];
	}

	const ruleValue = (assignment: Assignment) => (assignment.rule ? `${assignment.rule.field}:${assignment.rule.value}` : ``);

	let ruleError = $state(``);

	async function saveRule(transaction: BankTransaction, option: string) {
		if (!option) return;
		const [field, ...rest] = option.split(`:`);
		const { budgetItem, ignore } = assign(transaction);
		ruleError = ``;
		try {
			await gql(
				`mutation($field: String!, $value: String!, $budgetItem: String, $ignore: Boolean) { setBudgetRule(field: $field, value: $value, budgetItem: $budgetItem, ignore: $ignore) { success } }`,
				{ field, value: rest.join(`:`), budgetItem, ignore }
			);
			await onRulesChanged();
			// Now the saved rule drives this row (and any others it matches).
			overrides.delete(transaction.id);
		}
		catch {
			ruleError = `Couldn't save that rule - try again.`;
		}
	}

	async function deleteRule(rule: BudgetRule) {
		ruleError = ``;
		try {
			await gql(`mutation($id: String!) { deleteBudgetRule(id: $id) { success } }`, { id: rule.id });
			await onRulesChanged();
		}
		catch {
			ruleError = `Couldn't delete that rule - try again.`;
		}
	}

	let saving = new SvelteMap<string, boolean>();
	let saved = new SvelteMap<string, boolean>();
	let saveErrors = new SvelteMap<string, string>();

	async function saveWeek(weekStart: string, weekTotals: [string, number][]) {
		saving.set(weekStart, true);
		saved.delete(weekStart);
		saveErrors.delete(weekStart);
		try {
			const ops = weekTotals.map((_, i) => `op${i}: setBudgetSpend(budgetItem: $item${i}, weekStart: $weekStart, amount: $amount${i}) { success }`);
			const params = weekTotals.map((_, i) => `$item${i}: String!, $amount${i}: Float!`);
			await gql(
				`mutation($weekStart: String!, ${params.join(`, `)}) {\n${ops.join(`\n`)}\n}`,
				Object.fromEntries([[`weekStart`, weekStart], ...weekTotals.flatMap(([item, amount], i) => [[`item${i}`, item], [`amount${i}`, amount]])])
			);
			saved.set(weekStart, true);
			onSaved?.();
		}
		catch {
			saveErrors.set(weekStart, `Couldn't save - try again.`);
		}
		finally {
			saving.set(weekStart, false);
		}
	}

	const formatDay = (date: Date) => format(date, DATE_FORMATS.short);
</script>

<label for="budget-import-file">Bank export (CSV)</label>
<input
	id="budget-import-file"
	type="file"
	accept=".csv,text/csv"
	onchange={handleFile}
/>
{#if fileError}<p class={styles.error}>{fileError}</p>{/if}

<details class={styles.rules}>
	<summary>Saved rules ({rules.length})</summary>
	{#if rules.length}
		<ul>
			{#each rules as rule (rule.id)}
				<li>
					{FIELD_LABELS[rule.field ?? `payee`]}: <strong>{rule.value}</strong>
					→ {rule.ignore ? `Ignore` : itemNames.get(rule.budgetItem ?? ``) ?? `Unknown item`}
					<button
						type="button"
						onclick={() => deleteRule(rule)}
					>Delete<span class="sr-only"> rule for {rule.value}</span></button>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No rules yet - pick "Remember" on a transaction to add one.</p>
	{/if}
</details>
{#if ruleError}<p class={styles.error}>{ruleError}</p>{/if}

{#each weeks as week (week.weekStart)}
	{@const first = week.transactions[0].date}
	{@const last = week.transactions[week.transactions.length - 1].date}
	<section class={styles.week}>
		<h2>Week of {formatDay(parseISO(week.weekStart))} - {formatDay(endOfWeek(parseISO(week.weekStart), { weekStartsOn: 1 }))}</h2>
		<p>
			{week.transactions.length} transactions from {formatDay(first)} to {formatDay(last)}
			{#if week.unassigned}· <strong class={styles.warning}>{week.unassigned} unassigned</strong>{/if}
		</p>

		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Payee</th>
					<th>Category</th>
					<th class="amount">Amount</th>
					<th>Budget item</th>
					<th>Remember</th>
				</tr>
			</thead>
			<tbody>
				{#each week.transactions as transaction (transaction.id)}
					{@const assignment = assign(transaction)}
					<tr data-ignored={assignment.ignore}>
						<td><time datetime={transaction.date.toISOString()}>{formatDay(transaction.date)}</time></td>
						<td>
							{transaction.payee}
							{#if transaction.description && transaction.description !== transaction.payee}<small>{transaction.description}</small>{/if}
						</td>
						<td>{transaction.category}{#if transaction.tags.length}<small>{transaction.tags.join(`, `)}</small>{/if}</td>
						<td class="amount">{formatCurrency(transaction.amount)}</td>
						<td>
							<Select
								id="import-item-{transaction.id}"
								label="Budget item for {transaction.payee} on {formatDay(transaction.date)}"
								hiddenLabel
								options={itemOptions}
								bind:value={() => assignmentValue(assignment), (value) => setAssignment(transaction, value)}
							/>
						</td>
						<td>
							<Select
								id="import-rule-{transaction.id}"
								label="Remember choice for {transaction.payee} on {formatDay(transaction.date)}"
								hiddenLabel
								options={ruleOptions(transaction)}
								disabled={!assignment.ignore && !assignment.budgetItem}
								bind:value={() => ruleValue(assignment), (value) => saveRule(transaction, value)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<h3>Totals</h3>
		{#if week.totals.length}
			<table>
				<thead>
					<tr>
						<th>Budget item</th>
						<th class="amount">From this import</th>
						<th class="amount">Already logged</th>
					</tr>
				</thead>
				<tbody>
					{#each week.totals as [item, amount] (item)}
						{@const logged = loggedAmount(week.weekStart, item)}
						<tr>
							<td>{itemNames.get(item)}</td>
							<td class="amount">{formatCurrency(amount)}</td>
							<td class="amount">{logged == null ? `-` : formatCurrency(logged)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th>Total</th>
						<td class="amount">{formatCurrency(week.totals.reduce((sum, [, amount]) => sum + amount, 0))}</td>
						<td></td>
					</tr>
				</tfoot>
			</table>
			<div class={styles.save}>
				<button
					type="button"
					disabled={saving.get(week.weekStart)}
					onclick={() => saveWeek(week.weekStart, week.totals)}
				>{saving.get(week.weekStart) ? `Saving…` : `Save week's totals`}</button>
				{#if saved.get(week.weekStart)}<span class={styles.saved}>Saved</span>{/if}
				{#if saveErrors.get(week.weekStart)}<span class={styles.error}>{saveErrors.get(week.weekStart)}</span>{/if}
			</div>
		{:else}
			<p>Nothing assigned to a budget item yet.</p>
		{/if}
	</section>
{/each}
