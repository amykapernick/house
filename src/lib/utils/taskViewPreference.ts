// Per-device "last used view/filter" for the Tasks page, so a revisit lands
// back where it was left instead of resetting to the defaults every time.
// Deliberately localStorage, not synced anywhere - mirrors familyFilterPreference.ts
// and kanbanColumnPreference.ts.
const STORAGE_KEY = `task-view-preference`;

export type TaskViewPreference = {
	view?: string;
	dueFilter?: string;
};

export function getTaskViewPreference(): TaskViewPreference {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	}
	catch {
		return {};
	}
}

export function saveTaskViewPreference(preference: TaskViewPreference) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
	}
	catch {}
}
