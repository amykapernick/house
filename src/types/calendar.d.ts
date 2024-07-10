import type { TaskStatus } from "./tasks"
import type { Event as EventType } from "react-big-calendar"

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
	resource?: any,
	type: 'event' | 'task'
}

export type TaskEvent = EventBase & {
	status: TaskStatus
	type: 'task'
}

export type Event = (
	EventBase & {
		type: 'event'
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