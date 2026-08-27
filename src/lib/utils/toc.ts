import { writable } from 'svelte/store';

export type TocState = {
	hasEntries: boolean;
	showToc: boolean;
};

export const tocState = writable<TocState>({ hasEntries: false, showToc: false });

export function setTocHasEntries(hasEntries: boolean) {
	tocState.update((state) => ({ hasEntries, showToc: hasEntries ? state.showToc : false }));
}

export function toggleToc() {
	tocState.update((state) => ({ ...state, showToc: !state.showToc }));
}
