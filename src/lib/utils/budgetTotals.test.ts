import { describe, it, expect } from 'vitest';
import { totalMonthlyIncome, totalMonthlyExpenses, bucketTotals } from './budgetTotals';
import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';

const item = (overrides: Partial<BudgetItem> = {}): BudgetItem => ({
	id: `item-1`,
	...overrides,
});

describe(`totalMonthlyIncome`, () => {
	it(`returns 0 for an empty budget`, () => {
		expect(totalMonthlyIncome([])).toBe(0);
	});

	it(`sums only income items, treating a missing monthlyAmount as 0`, () => {
		const budget = [
			item({ income: true, monthlyAmount: 1000 }),
			item({ income: true }),
			item({ income: false, monthlyAmount: 500 }),
		];

		expect(totalMonthlyIncome(budget)).toBe(1000);
	});
});

describe(`totalMonthlyExpenses`, () => {
	it(`returns 0 for an empty budget`, () => {
		expect(totalMonthlyExpenses([])).toBe(0);
	});

	it(`sums only non-income items, treating a missing monthlyAmount as 0`, () => {
		const budget = [
			item({ income: false, monthlyAmount: 200 }),
			item({ income: false }),
			item({ income: true, monthlyAmount: 1000 }),
		];

		expect(totalMonthlyExpenses(budget)).toBe(200);
	});
});

describe(`bucketTotals`, () => {
	it(`returns an empty array for no buckets`, () => {
		expect(bucketTotals([], [])).toEqual([]);
	});

	it(`derives a bucket's income from its percentage of total income, not from its own items`, () => {
		const budget: BudgetItem[] = [item({ income: true, monthlyAmount: 1000 })];
		const bucket: BudgetBucket = {
			id: `bucket-1`,
			name: `Essentials`,
			percentage: 50,
			items: [item({ income: false, monthlyAmount: 100 })],
		};

		const [result] = bucketTotals([bucket], budget);

		expect(result.income).toBe(500);
		expect(result.expenses).toBe(100);
	});

	it(`defaults missing percentage and items to 0/[]`, () => {
		const bucket: BudgetBucket = { id: `bucket-2`, name: `No config` };

		const [result] = bucketTotals([bucket], []);

		expect(result.percentage).toBe(0);
		expect(result.income).toBe(0);
		expect(result.expenses).toBe(0);
	});

	it(`excludes income items from a bucket's own expenses total`, () => {
		const bucket: BudgetBucket = {
			id: `bucket-3`,
			name: `Mixed`,
			percentage: 10,
			items: [item({ income: true, monthlyAmount: 5000 }), item({ income: false, monthlyAmount: 50 })],
		};

		const [result] = bucketTotals([bucket], []);

		expect(result.expenses).toBe(50);
	});

	it(`passes percentageGoal through unchanged`, () => {
		const bucket: BudgetBucket = { id: `bucket-4`, name: `Goal`, percentageGoal: 20 };

		const [result] = bucketTotals([bucket], []);

		expect(result.percentageGoal).toBe(20);
	});
});
