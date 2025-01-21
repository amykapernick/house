import type { Event } from "@ts/calendar"

const parseEvents = (events: any[]): Event[] => {
	const formattedEvents: Event[] = events
		.filter((event) => event.dates)
		.map((event) => ({
			id: event.id,
			title: event.name,
			status: event.status,
			allDay: true,
			type: `event`,
			platform: `notion`,
			start: new Date(event.dates.start),
			end: event.dates?.end 
				? new Date(event.dates.end)
				: new Date(event.dates.start)
		}))

	return formattedEvents
}

export default parseEvents