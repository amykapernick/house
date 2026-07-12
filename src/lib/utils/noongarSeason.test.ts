import { describe, it, expect } from 'vitest';
import { getCurrentNoongarSeason } from './noongarSeason';

describe(`getCurrentNoongarSeason`, () => {
	it.each([
		[`Birak`, 11, 1], // December (month index 11)
		[`Birak`, 0, 1],
		[`Bunuru`, 1, 1], // February
		[`Bunuru`, 2, 1],
		[`Djeran`, 3, 1], // April
		[`Djeran`, 4, 1],
		[`Makuru`, 5, 1], // June
		[`Makuru`, 6, 1],
		[`Djilba`, 7, 1], // August
		[`Djilba`, 8, 1],
		[`Kambarang`, 9, 1], // October
		[`Kambarang`, 10, 1],
	])(`returns %s for month index %i`, (season, monthIndex, day) => {
		expect(getCurrentNoongarSeason(new Date(2026, monthIndex, day))).toBe(season);
	});

	it(`returns Makuru for 2026-07-09`, () => {
		expect(getCurrentNoongarSeason(new Date(2026, 6, 9))).toBe(`Makuru`);
	});

	it(`defaults to the real current date when no reference date is given`, () => {
		expect(getCurrentNoongarSeason()).toBe(getCurrentNoongarSeason(new Date()));
	});
});
