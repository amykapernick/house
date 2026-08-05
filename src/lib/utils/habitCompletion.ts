import { add, endOfDay, format, isWithinInterval, startOfDay, subDays } from 'date-fns';
import type { RecurrenceInterval } from '$types/habits';
import { getToken } from '$lib/auth';
import { getGraphqlUrl } from '$utils/fetchClientData';
import { DATE_FORMATS } from '$utils/dateFormats';

// When the next occurrence is due, per a habit's actual Todoist recurrence
// (e.g. "every 6 weeks") - falls back to a day later when the recurrence
// string couldn't be parsed (e.g. "every monday").
export function nextOccurrenceAfter(date: Date, recurrenceInterval: RecurrenceInterval) {
	if (!recurrenceInterval) return add(date, { days: 1 });

	const { count, unit } = recurrenceInterval;
	if (unit === `day`) return add(date, { days: count });
	if (unit === `week`) return add(date, { weeks: count });
	if (unit === `month`) return add(date, { months: count });
	return add(date, { years: count });
}

// A completion covers every day up to (not including) when the next
// occurrence is due, so callers don't falsely show gaps between completions
// on their actual cadence.
export function isDayDone(day: Date, completions: string[], recurrenceInterval: RecurrenceInterval) {
	return completions.some((completion) => {
		const completedAt = new Date(completion);
		const coversUntil = subDays(nextOccurrenceAfter(completedAt, recurrenceInterval), 1);

		return isWithinInterval(day, { start: startOfDay(completedAt), end: endOfDay(coversUntil) });
	});
}

// A day is only "explicitly" done if it's the actual completion date itself,
// as opposed to a later day just riding along in that completion's coverage
// window (see isDayDone above).
export function isExplicitlyDone(day: Date, completions: string[]) {
	const dateKey = format(day, DATE_FORMATS.iso);
	return completions.some((completion) => format(new Date(completion), DATE_FORMATS.iso) === dateKey);
}

export async function completeHabitRequest(id: string, completedAt?: string): Promise<boolean> {
	const token = await getToken();
	const args = completedAt ? `habitId: "${id}", completedAt: "${completedAt}"` : `habitId: "${id}"`;
	const res = await fetch(getGraphqlUrl(), {
		method: `POST`,
		headers: {
			'Content-Type': `application/json`,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({ query: `mutation { completeHabit(${args}) { success } }` }),
	}).then((r) => r.json());

	return !!res?.data?.completeHabit?.success;
}
