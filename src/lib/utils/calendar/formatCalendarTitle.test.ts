import { describe, it, expect } from 'vitest';
import formatCalendarTitle from './formatCalendarTitle';

describe(`formatCalendarTitle`, () => {
	it(`formats a single day as "d MMMM"`, () => {
		expect(formatCalendarTitle(new Date(`2026-11-24`), new Date(`2026-11-24`))).toBe(`24 November`);
	});

	it(`formats a whole calendar month as just the month name`, () => {
		expect(formatCalendarTitle(new Date(`2026-04-01`), new Date(`2026-04-30`))).toBe(`April`);
	});

	it(`formats a multi-day range within the same month as "d - d MMMM"`, () => {
		expect(formatCalendarTitle(new Date(`2026-07-20`), new Date(`2026-07-26`))).toBe(`20 - 26 July`);
	});

	it(`formats a range spanning two different months as "d MMMM - d MMMM"`, () => {
		expect(formatCalendarTitle(new Date(`2026-07-28`), new Date(`2026-08-03`))).toBe(`28 July - 3 August`);
	});

	it(`never includes a year`, () => {
		expect(formatCalendarTitle(new Date(`2026-12-28`), new Date(`2027-01-03`))).not.toMatch(/202[67]/);
	});
});
