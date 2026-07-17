export type Chore = {
	id: string,
	name: string,
	due?: string | null,
	recurrence?: string | null,
	isRecurring?: boolean,
	// chores sharing a label are grouped into one routine
	labels: string[]
}
