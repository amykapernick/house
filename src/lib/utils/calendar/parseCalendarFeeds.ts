import { sync } from 'node-ical';
import type { Event } from '$types/calendar';

type Calendar = {
	name: string
	url: string
	colour: string
}

const parseCalendars = async (calendars: Calendar[]) => {
	const results: Event[] = [];
	await Promise.all(
		calendars
			?.filter((calendar) => calendar.url)
			?.map(async (calendar) => {
				const res = await fetch(calendar.url);
				const text = await res.text();
				const parsed = sync.parseICS(text);
				const events = Object.values(parsed).filter(
					(event: any) => event.type === 'VEVENT',
				);
				results.push(
					...events.map((event: any) => ({
						start: event.start,
						end: event.end,
						id: event.uid,
						title: event.summary,
						type: 'event' as const,
						calendar: calendar,
						resource: [calendar],
						description: event.description,
						status: event.status,
						busy: event.transparency,
					})),
				);
			}),
	);
	return results;
};

export default parseCalendars;
