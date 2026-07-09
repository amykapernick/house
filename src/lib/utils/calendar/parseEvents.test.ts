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
});
