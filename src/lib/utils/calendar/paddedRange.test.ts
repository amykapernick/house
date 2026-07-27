import { describe, it, expect } from 'vitest';
import { computePaddedRange, needsRefetch } from './paddedRange';

describe(`computePaddedRange`, () => {
	it(`pads a visible week by one week on each side`, () => {
		const visible = { start: new Date(`2026-07-20T00:00:00Z`), end: new Date(`2026-07-26T00:00:00Z`) };

		expect(computePaddedRange(visible)).toEqual({
			start: new Date(`2026-07-14T00:00:00Z`),
			end: new Date(`2026-08-01T00:00:00Z`),
		});
	});

	it(`pads a visible month by one month's span on each side`, () => {
		const visible = { start: new Date(`2026-05-01T00:00:00Z`), end: new Date(`2026-05-31T00:00:00Z`) };
		const spanMs = visible.end.getTime() - visible.start.getTime();

		const result = computePaddedRange(visible);

		expect(result.start.getTime()).toBe(visible.start.getTime() - spanMs);
		expect(result.end.getTime()).toBe(visible.end.getTime() + spanMs);
	});
});

describe(`needsRefetch`, () => {
	const padded = { start: new Date(`2026-07-14T00:00:00Z`), end: new Date(`2026-08-01T00:00:00Z`) };

	it(`is true when nothing has been fetched yet`, () => {
		expect(needsRefetch({ start: new Date(`2026-07-20T00:00:00Z`), end: new Date(`2026-07-26T00:00:00Z`) }, null)).toBe(true);
	});

	it(`is false when the visible range is fully inside the last fetched padded range`, () => {
		const visible = { start: new Date(`2026-07-27T00:00:00Z`), end: new Date(`2026-08-01T00:00:00Z`) };

		expect(needsRefetch(visible, padded)).toBe(false);
	});

	it(`is true when the visible range starts before the padded range`, () => {
		const visible = { start: new Date(`2026-07-10T00:00:00Z`), end: new Date(`2026-07-16T00:00:00Z`) };

		expect(needsRefetch(visible, padded)).toBe(true);
	});

	it(`is true when the visible range ends after the padded range`, () => {
		const visible = { start: new Date(`2026-08-01T00:00:00Z`), end: new Date(`2026-08-08T00:00:00Z`) };

		expect(needsRefetch(visible, padded)).toBe(true);
	});
});
