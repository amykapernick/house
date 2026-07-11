export type HabitFrequency = `Daily` | `Weekly` | `Other`

export type Habit = {
	id: string,
	name: string,
	due?: string | null,
	recurrence?: string | null,
	frequency: HabitFrequency,
	streak: number,
	lastCompleted?: string | null,
	link: string
}
