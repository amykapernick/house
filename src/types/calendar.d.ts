export type Resource = {
	id: string,
	title: string
}

export type Event = {
	id: string,
	title: string,
	start: Date,
	end: Date,
	allDay?: boolean
	resource?: any,
}

export type UpdateEventFunction = (
	args: { 
		event: Event, 
		start: Date, 
		end: Date, 
		isAllDay?: boolean 
	},
	allEvents?: Event[]
) => any