import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordPageVisit, getRecentPages } from './recentPages';

describe(`recentPages`, () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it(`returns an empty array when nothing has been recorded`, () => {
		expect(getRecentPages()).toEqual([]);
	});

	it(`records a visit and returns it most-recent-first`, () => {
		recordPageVisit(`/tasks`);
		recordPageVisit(`/calendar`);

		expect(getRecentPages()).toEqual([`/calendar`, `/tasks`]);
	});

	it(`dedupes an existing entry for the same pathname, moving it to the front`, () => {
		recordPageVisit(`/tasks`);
		recordPageVisit(`/calendar`);
		recordPageVisit(`/tasks`);

		expect(getRecentPages()).toEqual([`/tasks`, `/calendar`]);
	});

	it(`caps the list at 5 entries`, () => {
		[`/a`, `/b`, `/c`, `/d`, `/e`, `/f`].forEach(recordPageVisit);

		expect(getRecentPages()).toEqual([`/f`, `/e`, `/d`, `/c`, `/b`]);
	});

	it(`returns an empty array when localStorage.getItem throws`, () => {
		vi.spyOn(Storage.prototype, `getItem`).mockImplementation(() => {
			throw new Error(`storage disabled`);
		});

		expect(getRecentPages()).toEqual([]);

		vi.restoreAllMocks();
	});

	it(`silently no-ops when localStorage.setItem throws`, () => {
		vi.spyOn(Storage.prototype, `setItem`).mockImplementation(() => {
			throw new Error(`quota exceeded`);
		});

		expect(() => recordPageVisit(`/tasks`)).not.toThrow();

		vi.restoreAllMocks();
	});
});
