import { describe, it, expect } from 'vitest';
import { parseCsv, parseTransactions, matchRule, autoAssign, weeklyTotals } from './budgetImport';
import type { BudgetRule } from '$types/budgetRule';

const HEADER = `Time,Account Name,Transaction Type,Payee,Description,Category,Tags,Subtotal (AUD),Currency,Subtotal (Transaction Currency),Round Up (AUD),Total (AUD),Payment Method,Settled Date`;

const csv = (...rows: string[]) => [HEADER, ...rows].join(`\n`);

describe(`parseCsv`, () => {
	it(`handles quoted fields containing commas and escaped quotes`, () => {
		expect(parseCsv(`a,"b, c","say ""hi"""\r\n1,2,3\n`)).toEqual([
			[`a`, `b, c`, `say "hi"`],
			[`1`, `2`, `3`],
		]);
	});

	it(`drops blank lines`, () => {
		expect(parseCsv(`a,b\n\n,\nc,d`)).toEqual([[`a`, `b`], [`c`, `d`]]);
	});
});

describe(`parseTransactions`, () => {
	it(`maps the Up export columns, with spend as a positive subtotal`, () => {
		const [transaction] = parseTransactions(csv(
			`2026-10-23T12:43:40+08:00,2Up Spending,Purchase,Grill'd,"Grilld Pty Ltd, Richmond",Restaurants & Cafes,"date night, food",-60.5,AUD,-60.5,0.5,-61,,24/10/2026`
		));

		expect(transaction).toMatchObject({
			type: `Purchase`,
			payee: `Grill'd`,
			description: `Grilld Pty Ltd, Richmond`,
			category: `Restaurants & Cafes`,
			tags: [`date night`, `food`],
			amount: 60.5,
			weekStart: `2026-10-19`,
		});
	});

	it(`trims trailing spaces on payees`, () => {
		const [transaction] = parseTransactions(csv(`2026-10-21T12:00:00+08:00,2Up Spending,Transfer,Daily Expenses ,,,,100,AUD,100,0,100,,21/10/2026`));
		expect(transaction.payee).toBe(`Daily Expenses`);
		expect(transaction.amount).toBe(-100);
	});

	it(`throws when expected columns are missing`, () => {
		expect(() => parseTransactions(`Date,Amount\n2026-10-01,5`)).toThrow(/Missing columns/);
	});
});

const transaction = (overrides = {}) => ({
	id: `0`,
	date: new Date(2026, 9, 20),
	weekStart: `2026-10-19`,
	type: `Purchase`,
	payee: `Woolworths`,
	description: ``,
	category: `Groceries`,
	tags: [] as string[],
	amount: 10,
	...overrides,
});

const rule = (overrides: Partial<BudgetRule>): BudgetRule => ({ id: `r`, ...overrides });

describe(`matchRule`, () => {
	it(`prefers payee over tag over category`, () => {
		const rules = [
			rule({ id: `category`, field: `category`, value: `Groceries`, budgetItem: `food` }),
			rule({ id: `tag`, field: `tag`, value: `baby`, budgetItem: `baby` }),
			rule({ id: `payee`, field: `payee`, value: `Woolworths`, budgetItem: `woolies` }),
		];

		expect(matchRule(transaction({ tags: [`baby`] }), rules)?.id).toBe(`payee`);
		expect(matchRule(transaction({ payee: `ALDI`, tags: [`baby`] }), rules)?.id).toBe(`tag`);
		expect(matchRule(transaction({ payee: `ALDI` }), rules)?.id).toBe(`category`);
		expect(matchRule(transaction({ payee: `ALDI`, category: `` }), rules)).toBeUndefined();
	});
});

describe(`autoAssign`, () => {
	it(`ignores transfers by default`, () => {
		expect(autoAssign(transaction({ type: `Transfer` }), [])).toEqual({ budgetItem: null, ignore: true });
		expect(autoAssign(transaction(), [])).toEqual({ budgetItem: null, ignore: false });
	});

	it(`lets a rule override the transfer default, or ignore a purchase`, () => {
		const toSavings = rule({ field: `payee`, value: `Woolworths`, budgetItem: `savings` });
		expect(autoAssign(transaction({ type: `Transfer` }), [toSavings]).budgetItem).toBe(`savings`);

		const ignored = rule({ field: `category`, value: `Groceries`, ignore: true, budgetItem: `food` });
		expect(autoAssign(transaction(), [ignored])).toMatchObject({ budgetItem: null, ignore: true });
	});
});

describe(`weeklyTotals`, () => {
	it(`sums assigned transactions per week and item, skipping ignored/unassigned ones`, () => {
		const transactions = [
			transaction({ id: `a`, amount: 10.1 }),
			transaction({ id: `b`, amount: 20.2 }),
			transaction({ id: `c`, amount: -5 }),
			transaction({ id: `d`, weekStart: `2026-10-12`, amount: 7 }),
			transaction({ id: `e`, amount: 100 }),
			transaction({ id: `f`, amount: 100 }),
		];
		const assignments: Record<string, { budgetItem: string | null, ignore: boolean }> = {
			a: { budgetItem: `food`, ignore: false },
			b: { budgetItem: `food`, ignore: false },
			c: { budgetItem: `food`, ignore: false },
			d: { budgetItem: `food`, ignore: false },
			e: { budgetItem: `food`, ignore: true },
			f: { budgetItem: null, ignore: false },
		};

		const totals = weeklyTotals(transactions, (t) => assignments[t.id]);

		expect(totals.get(`2026-10-19`)?.get(`food`)).toBe(25.3);
		expect(totals.get(`2026-10-12`)?.get(`food`)).toBe(7);
	});
});
