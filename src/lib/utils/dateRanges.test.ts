import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWeekRange, getPlanningRange } from './dateRanges';

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

describe(`getPlanningRange`, () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it(`on a Thursday, includes today through next Friday for 1 week`, () => {
		vi.setSystemTime(new Date(`2026-07-09T12:00:00Z`)); // Thursday

		expect(getPlanningRange(1)).toEqual({ start: `2026-07-09`, end: `2026-07-17` });
	});

	it(`on a Friday, includes today through the Friday after next for 2 weeks`, () => {
		vi.setSystemTime(new Date(`2026-07-10T12:00:00Z`)); // Friday

		expect(getPlanningRange(2)).toEqual({ start: `2026-07-10`, end: `2026-07-24` });
	});

	it(`on a Saturday, starts exactly on today`, () => {
		vi.setSystemTime(new Date(`2026-07-11T12:00:00Z`)); // Saturday

		expect(getPlanningRange(1)).toEqual({ start: `2026-07-11`, end: `2026-07-17` });
	});

	it(`scales the end date with the number of weeks`, () => {
		vi.setSystemTime(new Date(`2026-07-11T12:00:00Z`)); // Saturday

		expect(getPlanningRange(4)).toEqual({ start: `2026-07-11`, end: `2026-08-07` });
	});

	it(`handles a year boundary`, () => {
		vi.setSystemTime(new Date(`2026-12-30T12:00:00Z`)); // Wednesday

		expect(getPlanningRange(1)).toEqual({ start: `2026-12-30`, end: `2027-01-08` });
	});
});
