import type { Event } from '$types/calendar';

const parseEvents = (events: any[]): Event[] => {
	const formattedEvents: Event[] = events
		.filter((event) => event.dates)
		.map((event) => ({
			id: event.id,
			title: event.name,
			status: event.status,
			allDay: event.allDay ?? true,
			type: `event` as const,
			start: new Date(event.dates.start),
			end: event.dates?.end ? new Date(event.dates.end) : new Date(event.dates.start),
			colour: event.colour,
		}));

	return formattedEvents;
};

export default parseEvents;
