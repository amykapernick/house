import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekRange } from './dateRanges';

describe(`getWeekRange`, () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it(`defaults to yesterday through +6 days from today`, () => {
		vi.setSystemTime(new Date(`2026-07-09T12:00:00Z`));

		expect(getWeekRange()).toEqual({ start: `2026-07-08`, end: `2026-07-15` });
	});

	it(`shifts forward by a positive weekOffset`, () => {
		vi.setSystemTime(new Date(`2026-07-09T12:00:00Z`));

		expect(getWeekRange(1)).toEqual({ start: `2026-07-15`, end: `2026-07-22` });
	});

	it(`shifts backward by a negative weekOffset`, () => {
		vi.setSystemTime(new Date(`2026-07-09T12:00:00Z`));

		expect(getWeekRange(-1)).toEqual({ start: `2026-07-01`, end: `2026-07-08` });
	});

	it(`handles a month boundary`, () => {
		vi.setSystemTime(new Date(`2026-07-30T12:00:00Z`));

		expect(getWeekRange()).toEqual({ start: `2026-07-29`, end: `2026-08-05` });
	});

	it(`handles a year boundary`, () => {
		vi.setSystemTime(new Date(`2026-12-30T12:00:00Z`));

		expect(getWeekRange()).toEqual({ start: `2026-12-29`, end: `2027-01-05` });
	});
});
