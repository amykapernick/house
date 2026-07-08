import type { BudgetItem } from './budget';

export type BudgetBucket = {
	id: string
	name: string
	percentage?: number
	percentageGoal?: number
	items?: BudgetItem[]
}
