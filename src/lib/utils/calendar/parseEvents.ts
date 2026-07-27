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
			// this matters: @event-calendar/core reads the parsed Date back out
			// via its LOCAL getters to decide whether an end date already sits
			// at midnight (exclusive, as HA/ICS provide it) or needs bumping by
			// a day. In any timezone with a non-zero UTC offset (e.g.
			// Australia), a UTC-midnight end date reads back as a non-midnight
			// local time, so the library thinks it has a "time part" and bumps
			// it forward an extra day - the event visibly spills into the next
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
