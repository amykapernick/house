import { writable } from 'svelte/store';

export type Theme = `light` | `dark`;

const STORAGE_KEY = `theme`;

const getSystemTheme = (): Theme =>
	typeof window !== `undefined` && window.matchMedia(`(prefers-color-scheme: dark)`).matches ? `dark` : `light`;

const getStoredTheme = (): Theme | null => {
	if (typeof window === `undefined`) return null;
	const stored = window.localStorage.getItem(STORAGE_KEY);
	return stored === `light` || stored === `dark` ? stored : null;
};

export const theme = writable<Theme>(getStoredTheme() ?? getSystemTheme());

export function setTheme(value: Theme) {
	theme.set(value);
	if (typeof window !== `undefined`) {
		window.localStorage.setItem(STORAGE_KEY, value);
		document.documentElement.dataset.theme = value;
	}
}
