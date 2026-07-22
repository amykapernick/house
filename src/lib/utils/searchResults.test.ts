import { describe, expect, it } from 'vitest';
import { filterResults, buildContentResults, buildReferenceResults, buildSupplierResults, buildSmallHumanResults } from './searchResults';

describe(`filterResults`, () => {
	const toResult = (item: { id: string; name: string; extra?: string }) => ({
		key: item.id,
		label: item.name,
		section: `Pages` as const,
		link: `/`,
		searchText: item.extra,
	});

	it(`returns nothing for an empty term`, () => {
		expect(filterResults(``, [{ id: `1`, name: `Milk` }], toResult)).toEqual([]);
	});

	it(`matches on label, case-insensitively against a lower-cased term`, () => {
		const items = [{ id: `1`, name: `Milk` }, { id: `2`, name: `Bread` }];
		expect(filterResults(`milk`, items, toResult)).toEqual([toResult(items[0])]);
	});

	it(`also matches on searchText, not just label`, () => {
		const items = [{ id: `1`, name: `Milk`, extra: `dairy fridge` }];
		expect(filterResults(`fridge`, items, toResult)).toHaveLength(1);
	});

	it(`applies a limit when given one, but not when omitted`, () => {
		const items = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, name: `Milk ${i}` }));
		expect(filterResults(`milk`, items, toResult)).toHaveLength(10);
		expect(filterResults(`milk`, items, toResult, 3)).toHaveLength(3);
	});
});

describe(`buildContentResults`, () => {
	const entries = [{ slug: `possums`, title: `Possums`, icon: null, iconType: null }];
	const pages = [{ entrySlug: `possums`, pageSlug: `sleep`, title: `Possums Sleep`, group: `Sleep` }];

	it(`returns nothing for an empty term`, () => {
		expect(buildContentResults(entries, pages, ``)).toEqual([]);
	});

	it(`matches entries and pages by label`, () => {
		expect(buildContentResults(entries, pages, `possums`)).toHaveLength(2);
		expect(buildContentResults(entries, pages, `sleep`)).toEqual([expect.objectContaining({ label: `Possums Sleep` })]);
	});
});

describe(`buildReferenceResults`, () => {
	const resources = [
		{ id: `1`, name: `Plumber`, category: `Trades`, description: `Local plumber`, archived: false },
		{ id: `2`, name: `Electrician`, category: `Trades`, description: null, archived: true },
	];

	it(`matches on category/description via searchText, not just name`, () => {
		expect(buildReferenceResults(resources, `local`)).toEqual([expect.objectContaining({ label: `Plumber` })]);
	});

	it(`preserves the archived flag`, () => {
		expect(buildReferenceResults(resources, `electrician`)).toEqual([expect.objectContaining({ archived: true })]);
	});
});

describe(`buildSupplierResults`, () => {
	it(`surfaces one result per contact method, all sharing the matched name`, () => {
		const suppliers = [{ id: `1`, name: `Acme Plumbing`, category: [`Trades`], email: `a@acme.test`, phone: `12345`, archived: false }];
		const results = buildSupplierResults(suppliers, `acme`);
		expect(results).toHaveLength(3);
		expect(results.map((r) => r.sublabel)).toEqual([undefined, `Email a@acme.test`, `Call 12345`]);
	});

	it(`omits email/call rows when no contact detail is on file`, () => {
		const suppliers = [{ id: `1`, name: `Acme Plumbing`, category: [], archived: false }];
		expect(buildSupplierResults(suppliers, `acme`)).toHaveLength(1);
	});
});

describe(`buildSmallHumanResults`, () => {
	it(`returns nothing when smallHuman hasn't loaded yet`, () => {
		expect(buildSmallHumanResults(null, `tooth`)).toEqual([]);
	});

	it(`flattens named sub-items across tabs and links to the right tab hash`, () => {
		const smallHuman = { teeth: { teeth: [{ fdi: `51`, name: `Upper right central incisor` }] } };
		const results = buildSmallHumanResults(smallHuman, `incisor`);
		expect(results).toHaveLength(1);
		expect(results[0].link).toMatch(/#teeth$/);
	});
});
