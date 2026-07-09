import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// online.ts reads navigator.onLine and registers window listeners at module
// load time, so each case needs a fresh module instance after the mock is set.
async function importFresh() {
	vi.resetModules();
	return import(`./online`);
}

describe(`isOnline`, () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it(`initialises to true when navigator.onLine is true`, async () => {
		Object.defineProperty(navigator, `onLine`, { value: true, configurable: true });

		const { isOnline } = await importFresh();

		expect(get(isOnline)).toBe(true);
	});

	it(`initialises to false when navigator.onLine is false`, async () => {
		Object.defineProperty(navigator, `onLine`, { value: false, configurable: true });

		const { isOnline } = await importFresh();

		expect(get(isOnline)).toBe(false);
	});

	it(`flips to false on a window "offline" event`, async () => {
		Object.defineProperty(navigator, `onLine`, { value: true, configurable: true });

		const { isOnline } = await importFresh();
		window.dispatchEvent(new Event(`offline`));

		expect(get(isOnline)).toBe(false);
	});

	it(`flips to true on a window "online" event`, async () => {
		Object.defineProperty(navigator, `onLine`, { value: false, configurable: true });

		const { isOnline } = await importFresh();
		window.dispatchEvent(new Event(`online`));

		expect(get(isOnline)).toBe(true);
	});
});
