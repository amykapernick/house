import type { BudgetItem } from '$types/budget';
import type { BudgetBucket } from '$types/budgetBucket';

export type BucketTotal = {
	id: string;
	name: string;
	percentage: number;
	percentageGoal?: number;
	income: number;
	expenses: number;
};

export const totalMonthlyIncome = (budget: BudgetItem[]): number =>
	budget.filter((item) => item.income).reduce((sum, item) => sum + (item.monthlyAmount ?? 0), 0);

export const totalMonthlyExpenses = (budget: BudgetItem[]): number =>
	budget.filter((item) => !item.income).reduce((sum, item) => sum + (item.monthlyAmount ?? 0), 0);

// A bucket's income share is derived from its target percentage of total
// income, not summed from its items - buckets track spending, not earning.
export const bucketTotals = (buckets: BudgetBucket[], budget: BudgetItem[]): BucketTotal[] => {
	const income = totalMonthlyIncome(budget);

	return buckets.map((bucket) => {
		const expenses = (bucket.items ?? [])
			.filter((item) => !item.income)
			.reduce((sum, item) => sum + (item.monthlyAmount ?? 0), 0);

		return {
			id: bucket.id,
			name: bucket.name,
			percentage: bucket.percentage ?? 0,
			percentageGoal: bucket.percentageGoal,
			income: ((bucket.percentage ?? 0) / 100) * income,
			expenses,
		};
	});
};
