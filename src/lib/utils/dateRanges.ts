import { addWeeks, subDays, addDays, format } from 'date-fns';
import { DATE_FORMATS } from './dateFormats';

// "This week" for meal-planning purposes runs from yesterday through +6 days
// (8 days total). Computed from the browser's own clock so it always matches
// the viewer's local "today", regardless of what timezone the API runs in.
export function getWeekRange(weekOffset = 0): { start: string; end: string } {
	const start = subDays(addWeeks(new Date(), weekOffset), 1);
	const end = addDays(start, 7);

	return {
		start: format(start, DATE_FORMATS.iso),
		end: format(end, DATE_FORMATS.iso),
	};
}

function nextSaturdayDate(): Date {
	const today = new Date();
	return addDays(today, (6 - today.getDay() + 7) % 7);
}

// The coming Saturday (today itself if today already is one) - the start of
// the next full Sat-Fri grocery week.
export function getNextSaturday(): string {
	return format(nextSaturdayDate(), DATE_FORMATS.iso);
}

// Meal-planning-mode range: today through the end of the Nth Sat-Fri block
// starting at the coming Saturday (today itself if today already is one).
// Always a single contiguous span - a "leading partial week" before the
// first Saturday isn't a special case, it falls out of the start/end math.
export function getPlanningRange(weeks: number): { start: string; end: string } {
	const end = addDays(nextSaturdayDate(), weeks * 7 - 1);

	return {
		start: format(new Date(), DATE_FORMATS.iso),
		end: format(end, DATE_FORMATS.iso),
	};
}

// Dashboard meal plan widget range: 2 days back through 7 days forward from
// today, so a just-eaten meal stays visible for a couple of days while still
// showing most of the week ahead.
export function getDashboardMealPlanRange(): { start: string; end: string } {
	const today = new Date();

	return {
		start: format(subDays(today, 2), DATE_FORMATS.iso),
		end: format(addDays(today, 7), DATE_FORMATS.iso),
	};
}
