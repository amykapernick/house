import { describe, it, expect } from 'vitest';
import { monthComparison, bucketExpenseTrend } from './budgetSpendComparison';
import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';
import type { BudgetSpendEntry } from '$types/budgetSpend';

const JULY = new Date(2026, 6, 1);
const AUGUST = new Date(2026, 7, 1);

const item = (overrides: Partial<BudgetItem> = {}): BudgetItem => ({
	id: `item-1`,
	...overrides,
});

const entry = (overrides: Partial<BudgetSpendEntry> = {}): BudgetSpendEntry => ({
	id: `entry-1`,
	...overrides,
});

describe(`monthComparison`, () => {
	it(`returns zeros for empty inputs`, () => {
		const result = monthComparison([], [], [], JULY);

		expect(result.items).toEqual([]);
		expect(result.buckets).toEqual([]);
		expect(result.totalBudgeted).toBe(0);
		expect(result.totalActual).toBe(0);
		expect(result.totalDifference).toBe(0);
	});

	it(`attributes a week to the month its Monday (weekStart) falls in`, () => {
		const budget = [item({ id: `groceries`, monthlyAmount: 400 })];
		const entries = [
			// Monday 2026-07-27 is in July, even though the week it starts runs into August.
			entry({ budgetItem: `groceries`, weekStart: `2026-07-27`, amount: 100 }),
			// Monday 2026-08-03 is in August, so it's excluded from the July comparison.
			entry({ budgetItem: `groceries`, weekStart: `2026-08-03`, amount: 999 }),
		];

		const result = monthComparison(budget, [], entries, JULY);

		expect(result.items[0].actual).toBe(100);
	});

	it(`excludes income items from items, buckets, and totals`, () => {
		const budget = [
			item({ id: `salary`, income: true, monthlyAmount: 5000 }),
			item({ id: `rent`, income: false, monthlyAmount: 1500 }),
		];

		const result = monthComparison(budget, [], [], JULY);

		expect(result.items.map((i) => i.id)).toEqual([`rent`]);
		expect(result.totalBudgeted).toBe(1500);
	});

	it(`groups unbucketed items under "No bucket" while still counting them in the overall total`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials` };
		const budget = [
			item({ id: `rent`, monthlyAmount: 1000, bucket }),
			item({ id: `misc`, monthlyAmount: 50 }),
		];

		const result = monthComparison(budget, [bucket], [], JULY);

		const noBucket = result.buckets.find((b) => b.name === `No bucket`);
		expect(noBucket?.budgeted).toBe(50);
		expect(result.totalBudgeted).toBe(1050);
	});

	it(`sums multiple entries for the same item within a month`, () => {
		const budget = [item({ id: `groceries`, monthlyAmount: 400 })];
		const entries = [
			entry({ budgetItem: `groceries`, weekStart: `2026-07-06`, amount: 80 }),
			entry({ budgetItem: `groceries`, weekStart: `2026-07-13`, amount: 90 }),
		];

		const result = monthComparison(budget, [], entries, JULY);

		expect(result.items[0].actual).toBe(170);
	});

	it(`computes difference as actual minus budgeted, for items, buckets, and the overall total`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials` };
		const budget = [item({ id: `groceries`, monthlyAmount: 400, bucket })];
		const entries = [entry({ budgetItem: `groceries`, weekStart: `2026-07-06`, amount: 450 })];

		const result = monthComparison(budget, [bucket], entries, JULY);

		expect(result.items[0].difference).toBe(50);
		expect(result.buckets[0].difference).toBe(50);
		expect(result.totalDifference).toBe(50);
	});

	it(`ignores entries with no matching month`, () => {
		const budget = [item({ id: `groceries`, monthlyAmount: 400 })];
		const entries = [entry({ budgetItem: `groceries`, weekStart: `2026-06-29`, amount: 100 })];

		const result = monthComparison(budget, [], entries, AUGUST);

		expect(result.items[0].actual).toBe(0);
	});
});

describe(`bucketExpenseTrend`, () => {
	const NOW = new Date(2026, 6, 15); // 15 July 2026

	it(`returns one entry per bucket (plus "No bucket"), each with 5 periods at 0 for empty entries`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials`, percentage: 50 };
		const budget = [
			item({ id: `salary`, income: true, monthlyAmount: 4000 }),
			item({ id: `rent`, monthlyAmount: 1500, bucket }),
		];

		const result = bucketExpenseTrend(budget, [bucket], [], NOW);

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe(`Essentials`);
		expect(result[0].budgeted).toBe(1500);
		expect(result[0].periods.map((p) => p.label)).toEqual([`This Month`, `Last Month`, `Last Quarter`, `Last 6 Months`, `Last 12 Months`]);
		expect(result[0].periods.every((p) => p.actual === 0)).toBe(true);
	});

	it(`derives a bucket's income from its percentage of total income, and 0 for the unallocated "No bucket" group`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials`, percentage: 50 };
		const budget = [
			item({ id: `salary`, income: true, monthlyAmount: 4000 }),
			item({ id: `rent`, monthlyAmount: 1500, bucket }),
			item({ id: `misc`, monthlyAmount: 50 }),
		];

		const result = bucketExpenseTrend(budget, [bucket], [], NOW);

		expect(result.find((b) => b.name === `Essentials`)?.income).toBe(2000);
		expect(result.find((b) => b.name === `No bucket`)?.income).toBe(0);
	});

	it(`keeps buckets' actual spend separate from one another`, () => {
		const groceries: BudgetBucket = { id: `groceries-bucket`, name: `Groceries` };
		const bills: BudgetBucket = { id: `bills-bucket`, name: `Bills` };
		const budget = [
			item({ id: `food`, monthlyAmount: 400, bucket: groceries }),
			item({ id: `power`, monthlyAmount: 150, bucket: bills }),
		];
		const entries = [
			entry({ budgetItem: `food`, weekStart: `2026-07-06`, amount: 100 }),
			entry({ budgetItem: `power`, weekStart: `2026-07-06`, amount: 60 }),
		];

		const result = bucketExpenseTrend(budget, [groceries, bills], entries, NOW);

		expect(result.find((b) => b.id === `groceries-bucket`)?.periods[0].actual).toBe(100);
		expect(result.find((b) => b.id === `bills-bucket`)?.periods[0].actual).toBe(60);
	});

	it(`uses each month's own actual for "This Month" and "Last Month"`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials` };
		const budget = [item({ id: `groceries`, monthlyAmount: 400, bucket })];
		const entries = [
			entry({ budgetItem: `groceries`, weekStart: `2026-07-06`, amount: 100 }), // this month
			entry({ budgetItem: `groceries`, weekStart: `2026-06-08`, amount: 80 }), // last month
		];

		const result = bucketExpenseTrend(budget, [bucket], entries, NOW);
		const periods = result[0].periods;

		expect(periods.find((p) => p.label === `This Month`)?.actual).toBe(100);
		expect(periods.find((p) => p.label === `Last Month`)?.actual).toBe(80);
	});

	it(`averages a bucket's actual spend over the trailing N completed months, excluding the current month`, () => {
		const bucket: BudgetBucket = { id: `bucket-1`, name: `Essentials` };
		const budget = [item({ id: `groceries`, monthlyAmount: 400, bucket })];
		const entries = [
			entry({ budgetItem: `groceries`, weekStart: `2026-07-06`, amount: 999 }), // this month - excluded from trailing averages
			entry({ budgetItem: `groceries`, weekStart: `2026-06-08`, amount: 90 }), // last month
			entry({ budgetItem: `groceries`, weekStart: `2026-05-04`, amount: 60 }), // 2 months ago
			entry({ budgetItem: `groceries`, weekStart: `2026-04-06`, amount: 30 }), // 3 months ago
		];

		const result = bucketExpenseTrend(budget, [bucket], entries, NOW);
		const periods = result[0].periods;

		expect(periods.find((p) => p.label === `Last Quarter`)?.actual).toBe((90 + 60 + 30) / 3);
	});
});
