const STORAGE_KEY = `recent-pages`;
const MAX_ENTRIES = 5;

export function recordPageVisit(pathname: string) {
	try {
		const existing = getRecentPages().filter((link) => link !== pathname);
		localStorage.setItem(STORAGE_KEY, JSON.stringify([pathname, ...existing].slice(0, MAX_ENTRIES)));
	}
	catch {}
}

export function getRecentPages(): string[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	}
	catch {
		return [];
	}
}
