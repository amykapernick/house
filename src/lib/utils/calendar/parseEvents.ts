import { parseISO } from 'date-fns';
import type { Event } from '$types/calendar';

type ParsedEvent = Extract<Event, { type: `event` }>;

const parseEvents = (events: any[]): ParsedEvent[] => {
	const formattedEvents: ParsedEvent[] = events
		.filter((event) => event.dates)
		.map((event) => ({
			id: event.id,
			title: event.name,
			status: event.status,
			allDay: event.allDay ?? true,
			type: `event` as const,
			// parseISO (not `new Date`) - a bare date like "2026-07-27" (no time,
			// no offset) is parsed as UTC midnight by the native Date
			// constructor, but as local midnight by parseISO. For allDay events
			// this matters regardless of which calendar library reads the
			// result: a UTC-midnight Date is a non-midnight local time in any
			// timezone with a non-zero offset (e.g. Australia), so grid/layout
			// code working in local time (day-of-month, weekday, "is this
			// midnight" checks - @svar-ui/calendar-store's normalizeAllDayEnd
			// does exactly this for events it creates via its own add/update
			// actions, though not for the bulk events array fed in below) would
			// otherwise read the event as spanning into part of the next local
			// day. Unit tests run pinned to TZ=UTC (see vitest.config.ts) so
			// this doesn't reproduce there; parseISO avoids it in every timezone.
			start: parseISO(event.dates.start),
			end: event.dates?.end ? parseISO(event.dates.end) : parseISO(event.dates.start),
			colour: event.colour,
			resource: event.family,
			platform: event.platform,
		}));

	return formattedEvents;
};

export default parseEvents;
