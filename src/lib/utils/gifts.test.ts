import { describe, it, expect, vi } from 'vitest';

vi.mock(`$lib/auth`, () => ({ getToken: async () => null }));
vi.mock(`$utils/fetchClientData`, () => ({ default: vi.fn(), clearCachePrefix: vi.fn(), getGraphqlUrl: () => `/api/graphql` }));

const { describeDaysUntil } = await import(`./gifts`);

describe(`describeDaysUntil`, () => {
	it(`reads naturally`, () => {
		expect([0, 1, 5, -1, -3].map(describeDaysUntil)).toEqual([`Today`, `Tomorrow`, `In 5 days`, `Yesterday`, `3 days ago`]);
	});
});
