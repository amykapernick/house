import { describe, it, expect } from 'vitest';
import { mapTimeToX } from './sunPath';

describe(`mapTimeToX`, () => {
	const START = `2026-07-19T16:00:00.000Z`;
	const END = `2026-07-20T16:00:00.000Z`;

	it(`places the domain start at 0 and end at 1`, () => {
		expect(mapTimeToX(START, START, END)).toBe(0);
		expect(mapTimeToX(END, START, END)).toBe(1);
	});

	it(`places the midpoint at 0.5`, () => {
		expect(mapTimeToX(`2026-07-20T04:00:00.000Z`, START, END)).toBeCloseTo(0.5, 5);
	});

	it(`clamps instants outside the domain to 0 or 1`, () => {
		expect(mapTimeToX(`2026-07-18T00:00:00.000Z`, START, END)).toBe(0);
		expect(mapTimeToX(`2026-07-22T00:00:00.000Z`, START, END)).toBe(1);
	});
});
