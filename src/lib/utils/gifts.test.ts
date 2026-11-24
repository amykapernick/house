import { describe, it, expect, vi } from 'vitest';

vi.mock(`$lib/auth`, () => ({ getToken: async () => null }));
vi.mock(`$utils/fetchClientData`, () => ({ default: vi.fn(), clearCachePrefix: vi.fn(), getGraphqlUrl: () => `/api/graphql` }));

const { describeDaysUntil } = await import(`./gifts`);

describe(`describeDaysUntil`, () => {
	it(`reads naturally`, () => {
		expect([0, 1, 5, -1, -3].map(describeDaysUntil)).toEqual([`Today`, `Tomorrow`, `In 5 days`, `Yesterday`, `3 days ago`]);
	});

	it(`rounds to weeks, months and years once it's further off`, () => {
		expect([7, 10, 27, 28, 45, 200, 364, 365, 800].map(describeDaysUntil)).toEqual([
			`In 1 week`, `In 1 week`, `In 4 weeks`, `In 1 month`, `In 1 month`, `In 7 months`, `In 12 months`, `In 1 year`, `In 2 years`,
		]);
		expect([-7, -60, -400].map(describeDaysUntil)).toEqual([`1 week ago`, `2 months ago`, `1 year ago`]);
	});
});
