import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, startOfDay, startOfWeek } from 'date-fns';
import { DATE_FORMATS } from '$utils/dateFormats';

export type YearViewEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	backgroundColor?: string;
	textColor?: string;
	extendedProps?: Record<string, unknown>;
};

export type YearDayCell = {
	date: Date | null;
	isToday: boolean;
	events: YearViewEvent[];
};

export type YearMonth = {
	index: number;
	label: string;
	weeks: YearDayCell[][];
};

// Mirrors CalendarBase's firstDay: 1 (weeks start Monday) so a year view lines
// up with the rest of the calendar.
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

// event.end is an exclusive end date (see parseEvents.ts) - but when no end
// was provided, parseEvents/parseTasks both default it to the same instant as
// start, which would cover zero days under strict exclusivity. Bumping it
// forward a day only in that case keeps single-day events showing on their
// one day, while still treating a real multi-day end as exclusive.
function eventCoversDay(event: YearViewEvent, day: Date): boolean {
	const effectiveEnd = isSameDay(event.end, event.start) ? addDays(event.start, 1) : event.end;
	return !isBefore(day, startOfDay(event.start)) && isBefore(day, effectiveEnd);
}

export function buildYearMonths(year: number, events: YearViewEvent[], today: Date = new Date()): YearMonth[] {
	const allDayEvents = events.filter((event) => event.allDay);

	return Array.from({ length: 12 }, (_, monthIndex) => {
		const monthStart = new Date(year, monthIndex, 1);
		const monthEnd = endOfMonth(monthStart);
		const gridStart = startOfWeek(monthStart, WEEK_OPTIONS);
		const gridEnd = endOfWeek(monthEnd, WEEK_OPTIONS);

		const cells: YearDayCell[] = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
			const inMonth = isSameMonth(day, monthStart);
			return {
				date: inMonth ? day : null,
				isToday: inMonth && isSameDay(day, today),
				events: inMonth ? allDayEvents.filter((event) => eventCoversDay(event, day)) : [],
			};
		});

		const weeks: YearDayCell[][] = [];
		for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

		return { index: monthIndex, label: format(monthStart, DATE_FORMATS.monthName), weeks };
	});
}

export default buildYearMonths;
