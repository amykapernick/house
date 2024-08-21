import { parse } from "date-fns";
import type { Event } from "@ts/calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";

export const resizeEvent = ({event, start, end}: EventInteractionArgs<Event>, allEvents: Event[]): Event[] => {
	const updatedEvents = allEvents.map((e) => {
		if (e.id === event.id) {
			return ({ 
				...e, 
				start: typeof start === `string` ? parse(start, `yyyy-MM-dd`, new Date()) : start,
				end: typeof end === `string` ? parse(end, `yyyy-MM-dd`, new Date()) : end,
			});
		}
		return e;
	});
	
	return updatedEvents
}
export const moveEvent = ({event, start, end, isAllDay = false}: EventInteractionArgs<Event>, allEvents: Event[]): Event[] => {
	const updatedEvents: Event[] = allEvents.map((e) => {
		if (e.id === event.id) {
			return ({ 
				...e, 
				start: typeof start === `string` ? parse(start, `yyyy-MM-dd`, new Date()) : start,
				end: typeof end === `string` ? parse(end, `yyyy-MM-dd`, new Date()) : end,
				allDay: isAllDay
			});
		}
		return e;
	});
	
	return updatedEvents
}