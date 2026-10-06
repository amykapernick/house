import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock(`$lib/auth`, () => ({ getToken: vi.fn().mockResolvedValue(`test-token`) }));
vi.mock(`$utils/fetchClientData`, () => ({ getGraphqlUrl: () => `https://api.example.com/graphql` }));

import { createTask } from './createTask';

describe(`createTask`, () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it(`returns success on a successful mutation response`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { createTask: { success: true } } }),
		}));

		const result = await createTask(`Buy milk`);

		expect(result).toEqual({ success: true });
	});

	it(`passes the content as a GraphQL variable, not interpolated into the query`, async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { createTask: { success: true } } }),
		});
		vi.stubGlobal(`fetch`, fetchMock);

		await createTask(`Buy milk" } evil { success`);

		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.variables).toEqual({ content: `Buy milk" } evil { success` });
		expect(body.query).not.toContain(`Buy milk`);
	});

	it(`surfaces an API-level rejection as a plain failure`, async () => {
		vi.stubGlobal(`fetch`, vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ data: { createTask: { success: false } } }),
		}));

		const result = await createTask(`Buy milk`);

		expect(result).toEqual({ success: false });
	});
});
