import { describe, it, expect } from 'vitest';
import isStaleCompletedTask from './isStaleCompletedTask';
import type { Task } from '$types/tasks';

const now = new Date(`2026-07-20T09:00:00Z`);

const task = (overrides: Partial<Task>): Task => ({
	id: `1`,
	name: `Task`,
	due: null as unknown as Date,
	status: `Done`,
	assigned: [],
	subtasks: [],
	parent: [],
	estimate: 0,
	project: [],
	platform: `notion`,
	link: ``,
	updatedAt: null,
	...overrides,
});

describe(`isStaleCompletedTask`, () => {
	it(`returns false for a task that isn't Done`, () => {
		expect(isStaleCompletedTask(task({ status: `Not Started`, updatedAt: `2026-01-01T00:00:00Z` }), now)).toBe(false);
	});

	it(`returns false for a Done task with no updatedAt`, () => {
		expect(isStaleCompletedTask(task({ status: `Done`, updatedAt: null }), now)).toBe(false);
	});

	it(`returns false for a Done task updated within the last 7 days`, () => {
		expect(isStaleCompletedTask(task({ status: `Done`, updatedAt: `2026-07-15T09:00:00Z` }), now)).toBe(false);
	});

	it(`returns true for a Done task updated more than 7 days ago`, () => {
		expect(isStaleCompletedTask(task({ status: `Done`, updatedAt: `2026-07-10T00:00:00Z` }), now)).toBe(true);
	});
});
