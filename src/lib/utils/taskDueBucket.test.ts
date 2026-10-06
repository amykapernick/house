import { describe, it, expect } from 'vitest';
import taskDueBucket from './taskDueBucket';

const today = new Date(`2026-07-09T09:00:00`);

describe(`taskDueBucket`, () => {
	it(`returns null when there's no due date`, () => {
		expect(taskDueBucket(null as unknown as Date, today)).toBeNull();
	});

	it(`buckets a date before today as Overdue`, () => {
		expect(taskDueBucket(new Date(`2026-07-08T23:00:00`), today)).toBe(`Overdue`);
	});

	it(`buckets any time on the current day as Today, even earlier than now`, () => {
		expect(taskDueBucket(new Date(`2026-07-09T06:00:00`), today)).toBe(`Today`);
	});

	it(`buckets a date later the same day as Today`, () => {
		expect(taskDueBucket(new Date(`2026-07-09T18:00:00`), today)).toBe(`Today`);
	});

	it(`buckets a date within the next 7 days as This week`, () => {
		expect(taskDueBucket(new Date(`2026-07-14T10:00:00`), today)).toBe(`This week`);
	});

	it(`returns null for a date 7 or more days out`, () => {
		expect(taskDueBucket(new Date(`2026-07-16T00:00:00`), today)).toBeNull();
	});
});
