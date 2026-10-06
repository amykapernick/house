import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock(`$lib/auth`, () => ({ getToken: vi.fn().mockResolvedValue(`test-token`) }));
vi.mock(`$utils/fetchClientData`, () => ({ getGraphqlUrl: () => `https://api.example.com/graphql` }));

import { updateTaskStatus } from './updateTaskStatus';

describe(`updateTaskStatus`, () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it(`returns success on a successful mutation response`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { updateTaskStatus: { success: true } } }),
		}));

		const result = await updateTaskStatus(`t1`, `In Progress`);

		expect(result).toEqual({ success: true });
	});

	it(`surfaces an API-level rejection as a plain failure`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { updateTaskStatus: { success: false } } }),
		}));

		const result = await updateTaskStatus(`t1`, `In Progress`);

		expect(result).toEqual({ success: false });
	});
});
