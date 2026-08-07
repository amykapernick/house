import { describe, it, expect } from 'vitest';
import parseEvents from './parseEvents';

describe(`parseEvents`, () => {
	it(`filters out events with no dates`, () => {
		const events = [
			{ id: `1`, name: `No dates` },
			{ id: `2`, name: `Has dates`, dates: { start: `2026-07-09` } },
		];

		expect(parseEvents(events)).toHaveLength(1);
		expect(parseEvents(events)[0].id).toBe(`2`);
	});

	it(`defaults allDay to true when missing`, () => {
		const [result] = parseEvents([{ id: `1`, name: `Event`, dates: { start: `2026-07-09` } }]);

		expect(result.allDay).toBe(true);
	});

	it(`respects an explicit allDay value`, () => {
		const [result] = parseEvents([{ id: `1`, name: `Event`, allDay: false, dates: { start: `2026-07-09` } }]);

		expect(result.allDay).toBe(false);
	});

	it(`defaults end to start when dates.end is missing`, () => {
		const [result] = parseEvents([{ id: `1`, name: `Event`, dates: { start: `2026-07-09` } }]);

		expect(result.end).toEqual(result.start);
	});

	it(`uses dates.end when provided`, () => {
		const [result] = parseEvents([{ id: `1`, name: `Event`, dates: { start: `2026-07-09`, end: `2026-07-10` } }]);

		expect(result.start).toEqual(new Date(`2026-07-09`));
		expect(result.end).toEqual(new Date(`2026-07-10`));
	});

	it(`always tags the result as type "event"`, () => {
		const [result] = parseEvents([{ id: `1`, name: `Event`, dates: { start: `2026-07-09` } }]);

		expect(result.type).toBe(`event`);
	});

	it(`parses date-only start/end at local midnight, not UTC midnight (see the calendar-spilling-into-2-days bug)`, () => {
		// vitest runs pinned to TZ=UTC (see vitest.config.ts), where UTC
		// midnight and local midnight are the same instant - which is exactly
		// how this bug hid from every other test in this file. Overriding TZ
		// for just this test reproduces a positive-offset timezone (e.g.
		// Australia) where they aren't: `new Date('2026-07-28')` parses as UTC
		// midnight, which reads back as ~10-11am *local* time - a calendar grid
		// reading getHours()/getDate() in local time (as a browser naturally
		// does) would misread the intended exclusive-end date (the "spills
		// into 2 days" symptom). parseISO parses a bare date at local midnight
		// instead, so getHours()/getDate() below must land exactly on midnight
		// of the intended local calendar day.
		const originalTZ = process.env.TZ;
		process.env.TZ = `Australia/Sydney`;

		try {
			const [result] = parseEvents([{ id: `1`, name: `Event`, dates: { start: `2026-07-27`, end: `2026-07-28` } }]);

			expect(result.start.getHours()).toBe(0);
			expect(result.start.getDate()).toBe(27);
			expect(result.end.getHours()).toBe(0);
			expect(result.end.getDate()).toBe(28);
		}
		finally {
			process.env.TZ = originalTZ;
		}
	});

	it(`carries platform through so Notion-sourced events can be told apart from calendar-sourced ones`, () => {
		const [notionEvent, calendarEvent] = parseEvents([
			{ id: `1`, name: `Conference`, dates: { start: `2026-07-09` }, platform: `notion` },
			{ id: `2`, name: `Dentist`, dates: { start: `2026-07-09` }, platform: `calendar` },
		]);

		expect(notionEvent.platform).toBe(`notion`);
		expect(calendarEvent.platform).toBe(`calendar`);
	});
});
