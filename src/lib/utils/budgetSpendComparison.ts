import { isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns';
import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';
import type { BudgetSpendEntry } from '$types/budgetSpend';
import { totalMonthlyIncome } from '$utils/budgetTotals';

export type ItemComparison = {
	id: string;
	description: string;
	bucketId?: string;
	bucketName?: string;
	budgeted: number;
	actual: number;
	difference: number;
};

export type BucketComparison = {
	id: string;
	name: string;
	budgeted: number;
	actual: number;
	difference: number;
};

export type MonthComparison = {
	items: ItemComparison[];
	buckets: BucketComparison[];
	totalBudgeted: number;
	totalActual: number;
	totalDifference: number;
};

const NO_BUCKET_ID = `__no_bucket__`;
const NO_BUCKET_NAME = `No bucket`;

// A week's spend is attributed to whichever month its Monday (weekStart)
// falls in, rather than splitting a week across a month boundary - simplest,
// and matches the mental model of "the week you checked in for".
const actualByItem = (entries: BudgetSpendEntry[], monthStart: Date): Map<string, number> => {
	const totals = new Map<string, number>();

	for (const entry of entries) {
		if (!entry.weekStart || !entry.budgetItem) continue;
		if (!isSameMonth(parseISO(entry.weekStart), monthStart)) continue;

		totals.set(entry.budgetItem, (totals.get(entry.budgetItem) ?? 0) + (entry.amount ?? 0));
	}

	return totals;
};

// Income items are excluded from both sides - this compares spending against
// budget, not income, matching budgetTotals.ts's totalMonthlyExpenses convention.
export const monthComparison = (
	budget: BudgetItem[],
	buckets: BudgetBucket[],
	entries: BudgetSpendEntry[],
	monthStart: Date
): MonthComparison => {
	const actual = actualByItem(entries, monthStart);

	const items: ItemComparison[] = budget
		.filter((item) => !item.income)
		.map((item) => {
			const budgeted = item.monthlyAmount ?? 0;
			const itemActual = actual.get(item.id) ?? 0;

			return {
				id: item.id,
				description: item.description ?? ``,
				bucketId: item.bucket?.id,
				bucketName: item.bucket?.name,
				budgeted,
				actual: itemActual,
				difference: itemActual - budgeted,
			};
		});

	// Bucket rollup is built from the items above (item.bucket), not from
	// BudgetBucket.items, so items without a bucket roll into an explicit "No
	// bucket" group instead of silently vanishing from the overall total.
	const bucketTotals = new Map<string, { name: string; budgeted: number; actual: number }>();
	for (const item of items) {
		const bucketId = item.bucketId ?? NO_BUCKET_ID;
		const bucketName = item.bucketName ?? NO_BUCKET_NAME;
		const existing = bucketTotals.get(bucketId) ?? { name: bucketName, budgeted: 0, actual: 0 };
		existing.budgeted += item.budgeted;
		existing.actual += item.actual;
		bucketTotals.set(bucketId, existing);
	}

	const bucketOrder = [...buckets.map((bucket) => bucket.id), NO_BUCKET_ID];
	const bucketResults: BucketComparison[] = [...bucketTotals.entries()]
		.sort(([a], [b]) => bucketOrder.indexOf(a) - bucketOrder.indexOf(b))
		.map(([id, totals]) => ({
			id,
			name: totals.name,
			budgeted: totals.budgeted,
			actual: totals.actual,
			difference: totals.actual - totals.budgeted,
		}));

	const totalBudgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
	const totalActual = items.reduce((sum, item) => sum + item.actual, 0);

	return {
		items,
		buckets: bucketResults,
		totalBudgeted,
		totalActual,
		totalDifference: totalActual - totalBudgeted,
	};
};

export type BucketPeriod = {
	label: string;
	actual: number;
};

export type BucketExpenseTrend = {
	id: string;
	name: string;
	income: number;
	budgeted: number;
	periods: BucketPeriod[];
};

// Same period set as the per-bucket comparison above, broken down bucket by
// bucket instead of a single total - "This month"/"Last month" use that
// month's own actual figure, the longer windows average actual spend over
// the N most recently completed months (excluding the current, still
// in-progress one). income/budgeted are read once from the current figures,
// since (like monthComparison) there's no historical snapshot of the budget
// itself, only the current one.
export const bucketExpenseTrend = (
	budget: BudgetItem[],
	buckets: BudgetBucket[],
	entries: BudgetSpendEntry[],
	now: Date
): BucketExpenseTrend[] => {
	const bucketsForMonth = (monthStart: Date) => monthComparison(budget, buckets, entries, monthStart).buckets;

	const thisMonthBuckets = bucketsForMonth(startOfMonth(now));

	// Per-bucket actuals for each of the 12 most recently completed months,
	// index 0 = last month through index 11 = 12 months ago - computed once
	// and averaged over a slice below, rather than re-running monthComparison
	// once per window.
	const trailingMonths = Array.from({ length: 12 }, (_, i) => bucketsForMonth(startOfMonth(subMonths(now, i + 1))));
	const actualIn = (monthBuckets: BucketComparison[], bucketId: string) => monthBuckets.find((bucket) => bucket.id === bucketId)?.actual ?? 0;
	const average = (bucketId: string, months: number) => {
		const values = trailingMonths.slice(0, months).map((monthBuckets) => actualIn(monthBuckets, bucketId));
		return values.reduce((sum, value) => sum + value, 0) / months;
	};

	// A bucket's income share is its target percentage of total income, same
	// convention as budgetTotals.ts's bucketTotals - not summed from its items,
	// since buckets track spending, not earning. The "No bucket" pseudo-group
	// monthComparison synthesizes for unassigned items has no percentage
	// allocation, so it gets 0 here rather than a lookup miss.
	const totalIncome = totalMonthlyIncome(budget);
	const incomeFor = (bucketId: string) => ((buckets.find((bucket) => bucket.id === bucketId)?.percentage ?? 0) / 100) * totalIncome;

	return thisMonthBuckets.map((bucket) => ({
		id: bucket.id,
		name: bucket.name,
		income: incomeFor(bucket.id),
		budgeted: bucket.budgeted,
		periods: [
			{ label: `This Month`, actual: bucket.actual },
			{ label: `Last Month`, actual: actualIn(trailingMonths[0], bucket.id) },
			{ label: `Last Quarter`, actual: average(bucket.id, 3) },
			{ label: `Last 6 Months`, actual: average(bucket.id, 6) },
			{ label: `Last 12 Months`, actual: average(bucket.id, 12) },
		],
	}));
};
