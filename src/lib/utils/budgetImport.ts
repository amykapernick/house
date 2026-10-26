import { format, startOfWeek } from 'date-fns';
import type { BudgetRule, BudgetRuleField } from '$types/budgetRule';
import { DATE_FORMATS } from '$utils/dateFormats';

export type BankTransaction = {
	id: string
	date: Date
	weekStart: string
	type: string
	payee: string
	description: string
	category: string
	tags: string[]
	// Money out is positive, so a refund/credit assigned to an item reduces its total.
	// Uses the subtotal, not the total - round-ups go to savings, they aren't spend.
	amount: number
}

export type Assignment = {
	budgetItem: string | null
	ignore: boolean
	rule?: BudgetRule
}

export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = ``;
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (quoted) {
			if (char === `"` && text[i + 1] === `"`) {
				field += `"`;
				i++;
			}
			else if (char === `"`) quoted = false;
			else field += char;
		}
		else if (char === `"`) quoted = true;
		else if (char === `,`) {
			row.push(field);
			field = ``;
		}
		else if (char === `\n` || char === `\r`) {
			if (char === `\r` && text[i + 1] === `\n`) i++;
			row.push(field);
			rows.push(row);
			row = [];
			field = ``;
		}
		else field += char;
	}

	if (field || row.length) {
		row.push(field);
		rows.push(row);
	}

	return rows.filter((r) => r.some((value) => value.trim()));
}

const COLUMNS = {
	time: `Time`,
	type: `Transaction Type`,
	payee: `Payee`,
	description: `Description`,
	category: `Category`,
	tags: `Tags`,
	subtotal: `Subtotal (AUD)`,
} as const;

export function parseTransactions(text: string): BankTransaction[] {
	const [header = [], ...rows] = parseCsv(text);
	const index = Object.fromEntries(
		Object.entries(COLUMNS).map(([key, name]) => [key, header.findIndex((h) => h.trim() === name)])
	) as Record<keyof typeof COLUMNS, number>;

	const missing = Object.entries(index).filter(([, i]) => i === -1).map(([key]) => COLUMNS[key as keyof typeof COLUMNS]);
	if (missing.length) throw new Error(`Missing columns: ${missing.join(`, `)}`);

	return rows.map((row, i) => {
		const date = new Date(row[index.time]);
		return {
			id: String(i),
			date,
			weekStart: format(startOfWeek(date, { weekStartsOn: 1 }), DATE_FORMATS.iso),
			type: row[index.type]?.trim() ?? ``,
			payee: row[index.payee]?.trim() ?? ``,
			description: row[index.description]?.trim() ?? ``,
			category: row[index.category]?.trim() ?? ``,
			tags: (row[index.tags] ?? ``).split(`,`).map((tag) => tag.trim()).filter(Boolean),
			amount: -Number(row[index.subtotal] || 0),
		};
	});
}

export function transactionValues(transaction: BankTransaction, field: BudgetRuleField): string[] {
	if (field === `payee`) return transaction.payee ? [transaction.payee] : [];
	if (field === `category`) return transaction.category ? [transaction.category] : [];
	return transaction.tags;
}

// Most specific first - a payee rule beats a tag rule beats a category rule.
const RULE_PRIORITY: BudgetRuleField[] = [`payee`, `tag`, `category`];

export function matchRule(transaction: BankTransaction, rules: BudgetRule[]): BudgetRule | undefined {
	for (const field of RULE_PRIORITY) {
		const values = transactionValues(transaction, field);
		const rule = rules.find((r) => r.field === field && values.includes(r.value ?? ``));
		if (rule) return rule;
	}
}

export function autoAssign(transaction: BankTransaction, rules: BudgetRule[]): Assignment {
	const rule = matchRule(transaction, rules);
	if (rule) return { budgetItem: rule.ignore ? null : rule.budgetItem ?? null, ignore: !!rule.ignore, rule };

	// Transfers are money moving between your own accounts/savers, not spend -
	// skipped unless a rule says otherwise.
	return { budgetItem: null, ignore: transaction.type === `Transfer` };
}

/** weekStart -> budget item id -> total spend */
export function weeklyTotals(transactions: BankTransaction[], assign: (transaction: BankTransaction) => Assignment) {
	const totals = new Map<string, Map<string, number>>();

	for (const transaction of transactions) {
		const { budgetItem, ignore } = assign(transaction);
		if (ignore || !budgetItem) continue;

		const week = totals.get(transaction.weekStart) ?? new Map<string, number>();
		// Rounded to cents so float drift doesn't show up as 99.99999 in the saved amount.
		week.set(budgetItem, Math.round(((week.get(budgetItem) ?? 0) + transaction.amount) * 100) / 100);
		totals.set(transaction.weekStart, week);
	}

	return totals;
}
