export type BudgetRuleField = `payee` | `category` | `tag`

export type BudgetRule = {
	id: string
	field?: BudgetRuleField
	value?: string
	budgetItem?: string | null
	ignore?: boolean
}
