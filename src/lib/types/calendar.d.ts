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
	resource?: (User | Calendar)[],
	type: 'event' | 'task'
	editable?: boolean
}

export type TaskEvent = EventBase & {
	status: TaskStatus
	type: 'task',
	link: string,
	platform: 'notion' | 'todoist'
}

export type Event = (
	EventBase & {
		type: 'event'
	}
	| TaskEvent
)
