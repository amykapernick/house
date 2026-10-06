import { parseISO } from 'date-fns';
import type { Event } from '$types/calendar';

type ParsedEvent = Extract<Event, { type: `event` }>;

const parseEvents = (events: any[]): ParsedEvent[] => {
	// Recurring ICS events have occasionally come through with the same id
	// twice for one occurrence (seen with an overridden instance also
	// matching its recurrence rule) - Svelte's keyed each block throws hard
	// on a duplicate key, which was taking down the whole calendar's event
	// rendering, so duplicates are dropped defensively here rather than
	// trusting the source data to be unique.
	const seenIds = new Set<string>();
	const formattedEvents: ParsedEvent[] = events
		.filter((event) => event.dates)
		.filter((event) => {
			if (seenIds.has(event.id)) return false;
			seenIds.add(event.id);
			return true;
		})
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
