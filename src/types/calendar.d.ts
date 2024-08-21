import type { Colour, User } from "./global"
import type { TaskStatus } from "./tasks"
import type { Event as EventType } from "react-big-calendar"

export type Calendar = {
	name: string
	id: string
	url: string
	colour: Colour
	slug: string
}

export type Resource = {
	id: string,
	title: string
}

export type EventBase = EventType & {
	id: string,
	title: string,
	start: Date,
	end: Date,
	allDay?: boolean | undefined
	resource?: (User | Calendar)[],
	type: `event` | `task`
	editable?: boolean
}

export type TaskEvent = EventBase & {
	status: TaskStatus
	type: `task`,
	link: string,
	platform: `notion` | `todoist`
}

export type Event = (
	EventBase & {
		type: `event`
	} 
	| TaskEvent
)

export type UpdateEventFunction = (
	args: { 
		event: Event, 
		start: Date, 
		end: Date, 
		isAllDay?: boolean 
	},
	allEvents?: Event[]
) => any