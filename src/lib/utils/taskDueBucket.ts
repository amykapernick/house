import { addDays, isBefore, isSameDay, startOfDay } from 'date-fns';

export type DueBucket = `Overdue` | `Today` | `This week`;

// Coarser than TaskCalendar's per-day dueLabel grouping - List groups into just
// these three buckets, matching the List view mockup's Overdue/Today/This week
// sections and filter tabs. `today` is injectable so this stays deterministic in tests.
export default function taskDueBucket(due: Date, today: Date = new Date()): DueBucket | null {
	if (!due) return null;

	const todayStart = startOfDay(today);

	if (isBefore(due, todayStart)) return `Overdue`;
	if (isSameDay(due, todayStart)) return `Today`;
	if (isBefore(due, addDays(todayStart, 7))) return `This week`;

	return null;
}
