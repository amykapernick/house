import { isBefore, subDays } from 'date-fns';
import type { Task } from '$types/tasks';

// A Done task with no known last-updated time (Notion/GitHub always have one;
// Todoist tasks completed via this app's own checkbox may not, until the next
// real fetch) is left alone rather than assumed stale.
export default function isStaleCompletedTask(task: Task, now: Date = new Date()): boolean {
	if (task.status !== `Done` || !task.updatedAt) return false;
	return isBefore(new Date(task.updatedAt), subDays(now, 7));
}
