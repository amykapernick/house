export type BudgetItem = {
	id: string
	description?: string
	amount?: number
	period?: string
	income?: boolean
	bucketId?: string
	bucket?: string
	tags?: string
	note?: string
}
