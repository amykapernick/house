import type { User } from './global'

export type HabitViewRange = `week` | `month` | `year`

export type RecurrenceUnit = `day` | `week` | `month` | `year`

export type RecurrenceInterval = { count: number; unit: RecurrenceUnit } | null

export type Habit = {
	id: string,
	name: string,
	due?: string | null,
	recurrence?: string | null,
	recurrenceInterval: RecurrenceInterval,
	streak: number,
	lastCompleted?: string | null,
	link: string,
	assigned: User[],
	completions: string[]
}
