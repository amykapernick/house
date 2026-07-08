import type { BudgetBucket } from './budgetBucket';

export type BudgetItem = {
	id: string
	description?: string
	amount?: number
	period?: string
	monthlyAmount?: number
	income?: boolean
	bucket?: BudgetBucket
	tags?: string
	note?: string
}
