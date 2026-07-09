import { describe, it, expect } from 'vitest';
import { compareValues } from './sortable';

describe(`compareValues`, () => {
	it(`sorts null after a non-null value in ascending order`, () => {
		expect(compareValues(null, 1, `asc`)).toBe(1);
		expect(compareValues(1, null, `asc`)).toBe(-1);
	});

	it(`still sorts null last in descending order (not multiplied by direction)`, () => {
		expect(compareValues(null, 1, `desc`)).toBe(1);
		expect(compareValues(1, null, `desc`)).toBe(-1);
	});

	it(`treats two nulls as equal`, () => {
		expect(compareValues(null, null, `asc`)).toBe(0);
		expect(compareValues(null, null, `desc`)).toBe(0);
	});

	it(`compares strings via localeCompare, respecting direction`, () => {
		expect(compareValues(`a`, `b`, `asc`)).toBeLessThan(0);
		expect(compareValues(`a`, `b`, `desc`)).toBeGreaterThan(0);
	});

	it(`compares numbers arithmetically, respecting direction`, () => {
		expect(compareValues(1, 2, `asc`)).toBeLessThan(0);
		expect(compareValues(1, 2, `desc`)).toBeGreaterThan(0);
	});
});
