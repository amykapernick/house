import { format, isSameDay, endOfMonth } from 'date-fns';
import { DATE_FORMATS } from '$utils/dateFormats';

// Drives the calendar page's h1 - deliberately year-less (e.g. "20 - 26 July",
// "April", "24 November") to match what's actually useful at a glance for a
// household calendar. `start`/`end` are both inclusive, matching what
// @event-calendar/core's titleFormat callback receives.
const formatCalendarTitle = (start: Date, end: Date): string => {
	if (isSameDay(start, end)) return format(start, DATE_FORMATS.dayMonth);

	const isWholeMonth = start.getDate() === 1 && isSameDay(end, endOfMonth(start));
	if (isWholeMonth) return format(start, DATE_FORMATS.monthName);

	const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
	if (sameMonth) return `${format(start, `d`)} - ${format(end, DATE_FORMATS.dayMonth)}`;

	return `${format(start, DATE_FORMATS.dayMonth)} - ${format(end, DATE_FORMATS.dayMonth)}`;
};

export default formatCalendarTitle;
