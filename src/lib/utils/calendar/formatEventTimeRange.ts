import { format } from 'date-fns';

// Compact casual time range for an event's body, e.g. "10-11am", "2-3pm",
// "11:30am-2pm" - the am/pm marker is dropped from the start time whenever
// both ends fall in the same half of the day, since it'd otherwise repeat.
const formatTimePart = (date: Date): { hour: string; period: string } => ({
	hour: date.getMinutes() === 0 ? format(date, `h`) : format(date, `h:mm`),
	period: format(date, `a`).toLowerCase(),
});

const formatEventTimeRange = (start: Date, end: Date): string => {
	const startPart = formatTimePart(start);
	const endPart = formatTimePart(end);
	const startPeriod = startPart.period === endPart.period ? `` : startPart.period;

	return `${startPart.hour}${startPeriod}-${endPart.hour}${endPart.period}`;
};

export default formatEventTimeRange;
