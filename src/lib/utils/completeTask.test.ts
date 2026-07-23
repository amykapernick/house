import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock(`$lib/auth`, () => ({ getToken: vi.fn().mockResolvedValue(`test-token`) }));
vi.mock(`$utils/fetchClientData`, () => ({ getGraphqlUrl: () => `https://api.example.com/graphql` }));

import { completeTask } from './completeTask';
import { getQueuedCompletions } from './completionQueue';

describe(`completeTask`, () => {
	beforeEach(() => new Promise<void>((resolve) => {
		vi.restoreAllMocks();
		const request = indexedDB.deleteDatabase(`household-sync`);
		request.onsuccess = () => resolve();
		request.onerror = () => resolve();
	}));

	it(`returns success on a successful mutation response`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { completeTask: { success: true } } }),
		}));

		const result = await completeTask(`t1`, `todoist`);

		expect(result).toEqual({ success: true });
		expect(await getQueuedCompletions()).toEqual([]);
	});

	it(`surfaces an API-level rejection as a plain failure, not a queued one`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { completeTask: { success: false } } }),
		}));

		const result = await completeTask(`t1`, `todoist`);

		expect(result).toEqual({ success: false });
		expect(await getQueuedCompletions()).toEqual([]);
	});

	it(`queues the completion when fetch itself throws (offline)`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockRejectedValue(new TypeError(`Failed to fetch`)));

		const result = await completeTask(`t1`, `todoist`);

		expect(result).toEqual({ success: false, queued: true });
		expect(await getQueuedCompletions()).toEqual([{ taskId: `t1`, platform: `todoist` }]);
	});
});
