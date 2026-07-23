import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { queueCompletion, getQueuedCompletions, removeQueuedCompletion } from './completionQueue';

describe(`completionQueue`, () => {
	beforeEach(() => new Promise<void>((resolve) => {
		const request = indexedDB.deleteDatabase(`household-sync`);
		request.onsuccess = () => resolve();
		request.onerror = () => resolve();
	}));

	it(`starts empty`, async () => {
		expect(await getQueuedCompletions()).toEqual([]);
	});

	it(`queues and retrieves a completion`, async () => {
		await queueCompletion({ taskId: `t1`, platform: `todoist` });

		expect(await getQueuedCompletions()).toEqual([{ taskId: `t1`, platform: `todoist` }]);
	});

	it(`overwrites an existing entry for the same taskId rather than duplicating it`, async () => {
		await queueCompletion({ taskId: `t1`, platform: `todoist` });
		await queueCompletion({ taskId: `t1`, platform: `notion` });

		expect(await getQueuedCompletions()).toEqual([{ taskId: `t1`, platform: `notion` }]);
	});

	it(`removes a queued completion`, async () => {
		await queueCompletion({ taskId: `t1`, platform: `todoist` });
		await removeQueuedCompletion(`t1`);

		expect(await getQueuedCompletions()).toEqual([]);
	});

	it(`queues multiple distinct completions independently`, async () => {
		await queueCompletion({ taskId: `t1`, platform: `todoist` });
		await queueCompletion({ taskId: `t2`, platform: `notion` });

		const result = await getQueuedCompletions();
		expect(result).toHaveLength(2);
		expect(result.map((r) => r.taskId).sort()).toEqual([`t1`, `t2`]);
	});
});
