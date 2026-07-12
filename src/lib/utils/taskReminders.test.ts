import { describe, it, expect } from 'vitest';
import { findNewlyDueTasks } from './taskReminders';
import type { Task } from '$types/tasks';

function makeTask(overrides: Partial<Task>): Task {
	return {
		id: `task-1`,
		name: `Test task`,
		due: new Date(`2026-07-11T09:00:00`),
		status: `Not Started`,
		assigned: [],
		subtasks: [],
		parent: [],
		estimate: 0,
		project: [],
		platform: `todoist`,
		link: ``,
		...overrides,
	} as Task;
}

describe(`findNewlyDueTasks`, () => {
	const now = new Date(`2026-07-11T09:00:00`);

	it(`includes a task whose due time has passed and hasn't been reminded yet`, () => {
		const task = makeTask({ due: new Date(`2026-07-11T08:00:00`) });
		expect(findNewlyDueTasks([task], now, {})).toEqual([task]);
	});

	it(`excludes a task that isn't due yet`, () => {
		const task = makeTask({ due: new Date(`2026-07-11T10:00:00`) });
		expect(findNewlyDueTasks([task], now, {})).toEqual([]);
	});

	it(`excludes a task with no due date`, () => {
		const task = makeTask({ due: undefined as unknown as Date });
		expect(findNewlyDueTasks([task], now, {})).toEqual([]);
	});

	it(`excludes a Done task`, () => {
		const task = makeTask({ due: new Date(`2026-07-11T08:00:00`), status: `Done` });
		expect(findNewlyDueTasks([task], now, {})).toEqual([]);
	});

	it(`excludes an all-day task`, () => {
		const task = makeTask({ due: new Date(`2026-07-11T08:00:00`), allDay: true });
		expect(findNewlyDueTasks([task], now, {})).toEqual([]);
	});

	it(`excludes a task already reminded for its current due value`, () => {
		const due = new Date(`2026-07-11T08:00:00`);
		const task = makeTask({ id: `task-2`, due });
		const reminded = { [`task-2`]: String(due) };
		expect(findNewlyDueTasks([task], now, reminded)).toEqual([]);
	});

	it(`re-includes a task whose due date changed since it was last reminded`, () => {
		const task = makeTask({ id: `task-3`, due: new Date(`2026-07-11T08:30:00`) });
		const reminded = { [`task-3`]: String(new Date(`2026-07-11T07:00:00`)) };
		expect(findNewlyDueTasks([task], now, reminded)).toEqual([task]);
	});
});
