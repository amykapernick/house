// Per-device "last selected family member" for each page's FamilyFilter, so a
// manual choice sticks across visits instead of resetting to the "default to
// me" lookup every load. Deliberately localStorage, not synced anywhere.
function storageKey(pageKey: string): string {
	return `family-filter:${pageKey}`;
}

export function getSavedFamilyFilter(pageKey: string): string | undefined {
	try {
		return localStorage.getItem(storageKey(pageKey)) ?? undefined;
	}
	catch {
		return undefined;
	}
}

export function saveFamilyFilter(pageKey: string, selectedUserSlug: string) {
	try {
		localStorage.setItem(storageKey(pageKey), selectedUserSlug);
	}
	catch {}
}
