import { writable } from 'svelte/store';

const STORAGE_KEY = `sidebarCollapsed`;

const getStoredSidebarCollapsed = (): boolean => {
	if (typeof window === `undefined`) return false;
	return window.localStorage.getItem(STORAGE_KEY) === `true`;
};

export const sidebarCollapsed = writable<boolean>(getStoredSidebarCollapsed());

export function setSidebarCollapsed(value: boolean) {
	sidebarCollapsed.set(value);
	if (typeof window !== `undefined`) window.localStorage.setItem(STORAGE_KEY, String(value));
}
