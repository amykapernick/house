import { describe, it, expect } from 'vitest';
import { buildYearMonths, type YearViewEvent } from './buildYearMonths';

describe(`buildYearMonths`, () => {
	it(`returns 12 months in order`, () => {
		const months = buildYearMonths(2026, []);

		expect(months).toHaveLength(12);
		expect(months.map((month) => month.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
		expect(months[0].label).toBe(`January`);
		expect(months[11].label).toBe(`December`);
	});

	it(`weeks start on Monday, matching CalendarBase's firstDay: 1`, () => {
		// July 2026 starts on a Wednesday, so the first cell of the first week
		// should be Monday 29 June (outside the month).
		const [, , , , , , july] = buildYearMonths(2026, []);
		const firstCell = july.weeks[0][0];

		expect(firstCell.date).toBeNull();
	});

	it(`marks cells outside the current month as null with no events`, () => {
		const [, february] = buildYearMonths(2026, []);
		const paddingCell = february.weeks[0][0];

		expect(paddingCell.date).toBeNull();
		expect(paddingCell.events).toEqual([]);
	});

	it(`flags today's cell`, () => {
		const today = new Date(2026, 6, 15);
		const [, , , , , , july] = buildYearMonths(2026, [], today);
		const allCells = july.weeks.flat();
		const todayCell = allCells.find((cell) => cell.date && cell.date.getDate() === 15);

		expect(todayCell?.isToday).toBe(true);
		expect(allCells.filter((cell) => cell.isToday)).toHaveLength(1);
	});

	it(`only places all-day events, not timed ones`, () => {
		const events: YearViewEvent[] = [
			{ id: `1`, title: `All day`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: true },
			{ id: `2`, title: `Timed`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: false },
		];
		const [, , , , , , july] = buildYearMonths(2026, events);
		const cell = july.weeks.flat().find((cell) => cell.date?.getDate() === 10);

		expect(cell?.events.map((event) => event.id)).toEqual([`1`]);
	});

	it(`places a single-day event (end defaulted to start) on exactly one day`, () => {
		const events: YearViewEvent[] = [{ id: `1`, title: `Birthday`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 10), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);
		const cellsWithEvent = july.weeks.flat().filter((cell) => cell.events.length > 0);

		expect(cellsWithEvent).toHaveLength(1);
		expect(cellsWithEvent[0].date?.getDate()).toBe(10);
	});

	it(`spans a multi-day event across each day up to its exclusive end`, () => {
		// Exclusive end, matching parseEvents.ts's "dates.end" semantics -
		// 10th to 13th (exclusive) covers the 10th, 11th, and 12th only.
		const events: YearViewEvent[] = [{ id: `1`, title: `Holiday`, start: new Date(2026, 6, 10), end: new Date(2026, 6, 13), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);
		const daysWithEvent = july.weeks
			.flat()
			.filter((cell) => cell.events.length > 0)
			.map((cell) => cell.date?.getDate());

		expect(daysWithEvent).toEqual([10, 11, 12]);
	});

	it(`does not place an event on a day outside its own month's grid, even if the padding cell falls on that date`, () => {
		const events: YearViewEvent[] = [{ id: `1`, title: `June event`, start: new Date(2026, 5, 29), end: new Date(2026, 5, 29), allDay: true }];
		const [, , , , , , july] = buildYearMonths(2026, events);
		const paddingCell = july.weeks[0][0];

		expect(paddingCell.date).toBeNull();
		expect(paddingCell.events).toEqual([]);
	});
});
