// Per-device "last selected calendar view" (month/week/day/agenda/resources/
// year/timeline), so switching views sticks across visits instead of always
// reopening on the default. Deliberately localStorage, not synced anywhere -
// same convention as familyFilterPreference.ts.
const VALID_VIEWS = [`month`, `week`, `day`, `agenda`, `resources`, `year`, `timeline`] as const;
export type CalendarViewPreference = (typeof VALID_VIEWS)[number];

function storageKey(pageKey: string): string {
	return `calendar-view:${pageKey}`;
}

export function getSavedView(pageKey: string): CalendarViewPreference | undefined {
	try {
		const value = localStorage.getItem(storageKey(pageKey));
		return (VALID_VIEWS as readonly string[]).includes(value ?? ``) ? (value as CalendarViewPreference) : undefined;
	}
	catch {
		return undefined;
	}
}

export function saveView(pageKey: string, view: string) {
	try {
		localStorage.setItem(storageKey(pageKey), view);
	}
	catch {}
}
