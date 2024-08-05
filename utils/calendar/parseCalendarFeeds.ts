import { Event } from "@ts/calendar"
import { sync } from 'node-ical'

type Calendar = {
	name: string
	url: string
	colour: string
}

const parseCalendars = async (calendars: Calendar[]) => {
	const results: Event[] = [];
	await Promise.all(
		calendars.map(async (calendar) => {
			const res = await fetch(calendar.url);
			const text = await res.text();
			const parsed = sync.parseICS(text);
			const events = Object.values(parsed).filter(
				(event: any) => event.type === 'VEVENT'
			);
			results.push(
				...events.map((event: any) => ({
					...event,
					start: new Date(),
					end: new Date(),
					id: event.uid,
					title: event.summary,
					type: 'event',
					calendar: calendar.name,
					colour: calendar.colour,
				}))
			);
		})
	);
	return results;
};

export default parseCalendars