// Per-device "which Kanban status columns are hidden" preference, so a household
// that doesn't use e.g. Ongoing/Paused can tuck them away. Deliberately
// localStorage, not synced anywhere - mirrors familyFilterPreference.ts.
const STORAGE_KEY = `kanban-hidden-columns`;

export function getHiddenColumns(): string[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	}
	catch {
		return [];
	}
}

export function saveHiddenColumns(hidden: string[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
	}
	catch {}
}
