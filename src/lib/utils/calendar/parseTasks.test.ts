import { describe, it, expect } from 'vitest';
import parseTasks from './parseTasks';
import type { Task } from '$types/tasks';

const task = (overrides: Partial<Task> = {}): Task =>
	({
		id: `1`,
		name: `Task`,
		due: `2026-07-09` as unknown as Date,
		status: `Not Started`,
		assigned: [],
		subtasks: [],
		parent: [],
		estimate: 0,
		project: [],
		platform: `todoist`,
		link: ``,
		...overrides,
	}) as Task;

describe(`parseTasks`, () => {
	it(`filters out tasks with no due date`, () => {
		const tasks = [task({ id: `1`, due: undefined as unknown as Date }), task({ id: `2` })];

		const result = parseTasks(tasks);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(`2`);
	});

	it(`defaults allDay to false when missing (opposite of parseEvents)`, () => {
		const [result] = parseTasks([task()]);

		expect(result.allDay).toBe(false);
	});

	it(`respects an explicit allDay value`, () => {
		const [result] = parseTasks([task({ allDay: true })]);

		expect(result.allDay).toBe(true);
	});

	it(`defaults end to due when task.end is missing`, () => {
		const [result] = parseTasks([task({ due: `2026-07-09` as unknown as Date, end: undefined })]);

		expect(result.end).toEqual(new Date(`2026-07-09`));
	});

	it(`uses task.end when provided`, () => {
		const [result] = parseTasks([task({ due: `2026-07-09` as unknown as Date, end: `2026-07-10` })]);

		expect(result.end).toEqual(new Date(`2026-07-10`));
	});

	it(`parses a date-only due/end at local midnight, not UTC midnight (see parseEvents.test.ts for why)`, () => {
		const originalTZ = process.env.TZ;
		process.env.TZ = `Australia/Sydney`;

		try {
			const [result] = parseTasks([task({ due: `2026-07-27` as unknown as Date, end: `2026-07-28` })]);

			expect(result.start.getHours()).toBe(0);
			expect(result.start.getDate()).toBe(27);
			expect(result.end.getHours()).toBe(0);
			expect(result.end.getDate()).toBe(28);
		}
		finally {
			process.env.TZ = originalTZ;
		}
	});

	it(`always tags the result as type "task"`, () => {
		const [result] = parseTasks([task()]);

		expect(result.type).toBe(`task`);
	});

	it(`uses the single assignee's colour when assigned to exactly one family member`, () => {
		const [result] = parseTasks([task({ assigned: [{ slug: `amy`, name: `Amy`, colour: `pink` } as any] })]);

		expect(result.colour).toBe(`pink`);
	});

	it(`uses the shared household colour when assigned to the whole family`, () => {
		const tasks = [
			task({
				assigned: [
					{ slug: `amy`, name: `Amy`, colour: `pink` } as any,
					{ slug: `dan`, name: `Dan`, colour: `blue` } as any,
				],
			}),
		];

		const [result] = parseTasks(tasks);

		expect(result.colour).toBe(`kapers-crewe`);
	});

	it(`uses the shared household colour when assigned is empty`, () => {
		const [result] = parseTasks([task({ assigned: [] })]);

		expect(result.colour).toBe(`kapers-crewe`);
	});
});
