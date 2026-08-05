import { format, isToday, isTomorrow, isYesterday, isFuture, differenceInCalendarDays } from 'date-fns';
import { DATE_FORMATS } from './dateFormats';

// Todoist only gives us a time (due.datetime, ISO with a "T") when the task
// actually has one set - a plain due.date ("2026-07-21") is date-only, so
// don't invent a misleading "at 12:00am" for those.
export function formatDueDate(dueDate: string): string {
	const date = new Date(dueDate);
	const time = dueDate.includes(`T`) ? ` at ${format(date, `h:mmaaa`)}` : ``;

	if (isToday(date)) return `Today${time}`;
	if (isTomorrow(date)) return `Tomorrow${time}`;
	if (isYesterday(date)) return `Yesterday${time}`;
	// Anything else due within the next week reads better as a weekday name
	// ("Thu") than a full date - the year/month is obvious that close out.
	if (isFuture(date) && differenceInCalendarDays(date, new Date()) <= 7) return `${format(date, DATE_FORMATS.weekdayShort)}${time}`;
	return `${format(date, DATE_FORMATS.short)}${time}`;
}
