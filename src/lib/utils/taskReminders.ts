import { writable, get } from 'svelte/store';
import { notify } from './notifications';
import fetchTasksData from './tasksData';
import type { Task } from '$types/tasks';
import { isAuthenticated } from '$lib/auth';

const REMINDED_KEY = `taskReminders:reminded`;
const POLL_INTERVAL_MS = 60 * 1000;

// taskId -> the `due` value it was last reminded for. Keying by the due value
// (rather than just marking a task id as "done") means a rescheduled task is
// treated as a fresh reminder instead of being silently skipped forever.
type RemindedMap = Record<string, string>;

function loadReminded(): RemindedMap {
	if (typeof localStorage === `undefined`) return {};
	try {
		const raw = localStorage.getItem(REMINDED_KEY);
		return raw ? JSON.parse(raw) : {};
	}
	catch {
		return {};
	}
}

function persistReminded(reminded: RemindedMap) {
	if (typeof localStorage === `undefined`) return;
	try {
		localStorage.setItem(REMINDED_KEY, JSON.stringify(reminded));
	}
	catch {}
}

let reminded: RemindedMap = loadReminded();

export const dueReminderBanner = writable<Task[]>([]);

// Pure: a task is newly due once its due time has passed, unless it's already
// Done, is an all-day task (a date, not a time - firing at midnight would be
// more annoying than useful), or has already been reminded for this exact due
// value.
export function findNewlyDueTasks(tasks: Task[], now: Date, remindedMap: RemindedMap): Task[] {
	return tasks.filter((task) => {
		if (!task.due || task.allDay || task.status === `Done`) return false;
		if (remindedMap[task.id] === String(task.due)) return false;
		return new Date(task.due).getTime() <= now.getTime();
	});
}

export function dismissReminder(taskId: string) {
	dueReminderBanner.update((tasks) => tasks.filter((task) => task.id !== taskId));
}

function checkForDueTasks(tasks: Task[]) {
	const newlyDue = findNewlyDueTasks(tasks, new Date(), reminded);
	if (!newlyDue.length) return;

	dueReminderBanner.update((current) => [
		...current,
		...newlyDue.filter((task) => !current.some((existing) => existing.id === task.id)),
	]);

	newlyDue.forEach((task) => {
		reminded = { ...reminded, [task.id]: String(task.due) };
		notify(task.name, task.dueLabel ?? `Task due`, `task-reminder-${task.id}`);
	});
	persistReminded(reminded);
}

// Runs for the lifetime of the page (registered once at module load, not tied
// to any single component) so reminders keep firing regardless of which route
// is currently mounted - mirrors focusTimer.ts's own module-level interval.
if (typeof window !== `undefined`) {
	setInterval(() => {
		if (!get(isAuthenticated)) return;
		// Almost always resolves from fetchTasksData's own cache rather than the
		// network, so polling every minute stays cheap.
		fetchTasksData({ onStale: checkForDueTasks }).then(checkForDueTasks);
	}, POLL_INTERVAL_MS);
}
