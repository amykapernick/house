import { describe, it, expect } from 'vitest';
import monthlyAmount from './monthlyAmount';

describe(`monthlyAmount`, () => {
	it(`returns null when amount is null or undefined`, () => {
		expect(monthlyAmount(null, `Month`)).toBeNull();
		expect(monthlyAmount(undefined, `Month`)).toBeNull();
	});

	it(`treats 0 as a valid amount, not null`, () => {
		expect(monthlyAmount(0, `Month`)).toBe(0);
	});

	it(`converts a weekly amount using 52 weeks/year`, () => {
		expect(monthlyAmount(100, `Week`)).toBeCloseTo((100 * 52) / 12);
	});

	it(`converts a fortnightly amount using 26 fortnights/year, not a naive *2 of weekly`, () => {
		expect(monthlyAmount(100, `Fortnight`)).toBeCloseTo((100 * 26) / 12);
	});

	it(`treats a monthly amount as already-monthly`, () => {
		expect(monthlyAmount(100, `Month`)).toBe(100);
	});

	it(`converts a yearly amount by dividing by 12`, () => {
		expect(monthlyAmount(1200, `Year`)).toBe(100);
	});

	it(`falls back to Month for an unrecognised period`, () => {
		expect(monthlyAmount(100, `Fortnightly`)).toBe(100);
	});

	it(`falls back to Month when period is null`, () => {
		expect(monthlyAmount(100, null)).toBe(100);
	});
});
