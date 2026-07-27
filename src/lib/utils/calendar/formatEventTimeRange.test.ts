import { describe, it, expect } from 'vitest';
import formatEventTimeRange from './formatEventTimeRange';

describe(`formatEventTimeRange`, () => {
	it(`omits the start period when start and end share the same half of the day`, () => {
		expect(formatEventTimeRange(new Date(`2026-07-09T10:00:00`), new Date(`2026-07-09T11:00:00`))).toBe(`10-11am`);
		expect(formatEventTimeRange(new Date(`2026-07-09T14:00:00`), new Date(`2026-07-09T15:00:00`))).toBe(`2-3pm`);
	});

	it(`includes the start period when it crosses from am to pm`, () => {
		expect(formatEventTimeRange(new Date(`2026-07-09T11:30:00`), new Date(`2026-07-09T14:00:00`))).toBe(`11:30am-2pm`);
	});

	it(`shows minutes only when they're non-zero`, () => {
		expect(formatEventTimeRange(new Date(`2026-07-09T09:00:00`), new Date(`2026-07-09T09:15:00`))).toBe(`9-9:15am`);
	});
});
