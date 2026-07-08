import { writable } from 'svelte/store';

const initial = typeof navigator !== `undefined` ? navigator.onLine : true;

export const isOnline = writable(initial);

if (typeof window !== `undefined`) {
	window.addEventListener(`online`, () => isOnline.set(true));
	window.addEventListener(`offline`, () => isOnline.set(false));
}
