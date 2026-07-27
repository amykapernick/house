import type { Colour, User } from './global'
import type { TaskStatus } from './tasks'

export type Calendar = {
	name: string
	id: string
	url: string
	colour: Colour
	slug: string
}

export type EventBase = {
	id: string,
	title: string,
	start: Date,
	end: Date,
	allDay?: boolean
	colour?: string | null
	resource?: (User | Calendar)[],
	type: `event` | `task` | `meal`
	editable?: boolean
}

export type TaskEvent = EventBase & {
	status: TaskStatus
	type: `task`,
	link: string,
	platform: `notion` | `todoist`
}

export type MealEvent = EventBase & {
	type: `meal`,
	link?: string
}

export type Event = (
	EventBase & {
		type: `event`
		platform?: `notion` | `calendar`
	}
	| TaskEvent
	| MealEvent
)
