import { addDays, differenceInCalendarDays, eachDayOfInterval, endOfMonth, format, getDay, isBefore, isSameDay, max, min } from 'date-fns';
import { DATE_FORMATS } from '$utils/dateFormats';

export type YearViewEventInput = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	backgroundColor?: string;
	textColor?: string;
	extendedProps?: Record<string, unknown>;
};

// A YearViewEventInput positioned within one specific month - offset/span are
// only known once an event has been clipped to a month, so they don't exist
// on the input shape callers build.
export type YearViewEvent = YearViewEventInput & {
	offset: number; // Offset from the start of the month in days (0 = the 1st)
	span: number; // Number of days this event covers within the month
};

export type YearDayCell = {
	date: Date;
	isToday: boolean;
};

export type YearMonth = {
	index: number;
	label: string;
	days: YearDayCell[];
	events: YearViewEvent[];
	offset: number; // Offset for the week day it starts on relative to the first day of the week (Monday is the start of the week), so if the month starts on Monday, offset is 0, if it starts on Tuesday, offset is 1, etc.
};

// event.end is an exclusive end date (see parseEvents.ts) - but when no end
// was provided, parseEvents/parseTasks both default it to the same instant as
// start, which would cover zero days under strict exclusivity. Bumping it
// forward a day only in that case keeps single-day events showing on their
// one day, while still treating a real multi-day end as exclusive.
function effectiveEnd(event: YearViewEventInput): Date {
	return isSameDay(event.end, event.start) ? addDays(event.start, 1) : event.end;
}

export function buildYearMonths(year: number, events: YearViewEventInput[], today: Date = new Date()): YearMonth[] {
	const allDayEvents = events.filter((event) => event.allDay);

	return Array.from({ length: 12 }, (_, monthIndex) => {
		const monthStart = new Date(year, monthIndex, 1);
		const monthEnd = endOfMonth(monthStart);
		const monthEndExclusive = addDays(monthEnd, 1);
		// getDay is Sunday-first (0-6); shift to Monday-first to match WEEK_OPTIONS elsewhere.
		const offset = (getDay(monthStart) + 6) % 7;

		const days: YearDayCell[] = eachDayOfInterval({ start: monthStart, end: monthEnd }).map((date) => ({
			date,
			isToday: isSameDay(date, today),
		}));

		// Events only render at month level (one bar per month, spanning the days
		// it covers) rather than per-day - an event crossing a month boundary
		// shows up once per month it touches, each clipped to that month's days.
		// TODO: Events are showing up after the last day that start in the next month, (eg. New years day in december, after the 31st), check timezones
		const monthEvents: YearViewEvent[] = allDayEvents.flatMap((event) => {
			const segmentStart = max([event.start, monthStart]);
			const segmentEnd = min([effectiveEnd(event), monthEndExclusive]);

			if (!isBefore(segmentStart, segmentEnd)) return [];

			return [
				{
					...event,
					offset: differenceInCalendarDays(segmentStart, monthStart),
					span: differenceInCalendarDays(segmentEnd, segmentStart),
				},
			];
		});

		return { index: monthIndex, label: format(monthStart, DATE_FORMATS.monthName), days, events: monthEvents, offset };
	});
}

export default buildYearMonths;
