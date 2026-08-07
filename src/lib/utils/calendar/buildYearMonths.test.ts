import { describe, it, expect } from 'vitest';
import { buildYearMonths, type YearViewEventInput } from './buildYearMonths';

describe(`buildYearMonths`, () => {
	it(`returns 12 months in order`, () => {
		const months = buildYearMonths(2026, []);

		expect(months).toHaveLength(12);
		expect(months.map((month) => month.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
		expect(months[0].label).toBe(`January`);
		expect(months[11].label).toBe(`December`);
	});

	it(`offsets each month by the weekday its 1st falls on, Monday-first`, () => {
		const [, february, , , , , july] = buildYearMonths(2026, []);

		// 1 July 2026 is a Wednesday (Mon=0 ... Wed=2).
		expect(july.offset).toBe(2);
		// 1 February 2026 is a Sunday (Mon=0 ... Sun=6).
		expect(february.offset).toBe(6);
	});

	it(`each month's days are exactly the days in that month, with no padding`, () => {
		const [, february] = buildYearMonths(2026, []);

		expect(february.days).toHaveLength(28);
		expect(february.days[0].date.getDate()).toBe(1);
		expect(february.days.at(-1)?.date.getDate()).toBe(28);
	});

	it(`flags today's cell`, () => {
		const today = new Date(2026, 6, 15);
		const [, , , , , , july] = buildYearMonths(2026, [], today);
		const todayCell = july.days.find((day) => day.date.getDate() === 15);

		expect(todayCell?.isToday).toBe(true);
		expect(july.days.filter((day) => day.isToday)).toHaveLength(1);
	});

	it(`only places all-day events, not timed ones`, () => {
		const events: YearViewEventInput[] = [
			{ id: `1`, title: `All day`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: true },
			{ id: `2`, title: `Timed`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: false },
		];
		const [, , , , , , july] = buildYearMonths(2026, events);

		expect(july.events.map((event) => event.id)).toEqual([`1`]);
	});

	it(`places a single-day event (end defaulted to start) at its day-of-month offset with a span of 1`, () => {
		const events: YearViewEventInput[] = [{ id: `1`, title: `Birthday`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);

		expect(july.events).toHaveLength(1);
		expect(july.events[0]).toMatchObject({ offset: 9, span: 1 });
	});

	it(`spans a multi-day event up to its exclusive end`, () => {
		// Exclusive end, matching parseEvents.ts's "dates.end" semantics -
		// 10th to 13th (exclusive) covers the 10th, 11th, and 12th only.
		const events: YearViewEventInput[] = [{ id: `1`, title: `Holiday`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 13), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);

		expect(july.events).toHaveLength(1);
		expect(july.events[0]).toMatchObject({ offset: 9, span: 3 });
	});

	it(`does not place an event in a month it never touches`, () => {
		const events: YearViewEventInput[] = [{ id: `1`, title: `June event`, start: new Date(2026, 5, 29), end: new Date(2026, 5, 29), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);

		expect(july.events).toEqual([]);
	});

	it(`does not leak a next-month event (starting exactly at next month's midnight) into this month`, () => {
		// endOfMonth() lands at 23:59:59.999 on the last day, not midnight - a
		// naive addDays(monthEnd, 1) exclusive boundary would land at
		// 23:59:59.999 the next day too, letting a New Year's Day event
		// (starting exactly at next-month's midnight) count as "before" it.
		const events: YearViewEventInput[] = [{ id: `nye`, title: `New Year's Day`, start: new Date(2027, 0, 1), end: new Date(2027, 0, 2), allDay: true }];
		const [, , , , , , , , , , , december] = buildYearMonths(2026, events);

		expect(december.events).toEqual([]);
	});

	it(`repeats an event that spans a month boundary, once per month, clipped to that month's days`, () => {
		// 28 June - 3 July (exclusive end): covers the 28th-30th in June, 1st-2nd in July.
		const events: YearViewEventInput[] = [{ id: `1`, title: `Trip`, start: new Date(2026, 5, 28), end: new Date(2026, 6, 3), allDay: true }];
		const [, , , , , june, july] = buildYearMonths(2026, events);

		expect(june.events).toHaveLength(1);
		expect(june.events[0]).toMatchObject({ id: `1`, offset: 27, span: 3 });

		expect(july.events).toHaveLength(1);
		expect(july.events[0]).toMatchObject({ id: `1`, offset: 0, span: 2 });
	});
});
