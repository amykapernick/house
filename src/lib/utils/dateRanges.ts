import { addWeeks, subDays, addDays, format } from 'date-fns';

// "This week" for meal-planning purposes runs from yesterday through +6 days
// (8 days total). Computed from the browser's own clock so it always matches
// the viewer's local "today", regardless of what timezone the API runs in.
export function getWeekRange(weekOffset = 0): { start: string; end: string } {
	const start = subDays(addWeeks(new Date(), weekOffset), 1);
	const end = addDays(start, 7);

	return {
		start: format(start, 'yyyy-MM-dd'),
		end: format(end, 'yyyy-MM-dd'),
	};
}
