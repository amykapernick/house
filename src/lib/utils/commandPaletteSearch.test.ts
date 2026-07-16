import { describe, expect, it } from 'vitest';
import { parseDeepSearch } from './commandPaletteSearch';

describe(`parseDeepSearch`, () => {
	it(`returns null for plain queries`, () => {
		expect(parseDeepSearch(`milk`)).toBeNull();
		expect(parseDeepSearch(``)).toBeNull();
	});

	it(`does not treat quick-add commands as deep search`, () => {
		expect(parseDeepSearch(`/task Buy milk`)).toBeNull();
		expect(parseDeepSearch(`/shop Milk`)).toBeNull();
	});

	it(`searches every section when there's no scope token`, () => {
		expect(parseDeepSearch(`/s milk`)).toEqual({ scope: null, term: `milk` });
	});

	it(`scopes to a section via /token, lower-cases the term`, () => {
		expect(parseDeepSearch(`/s /task Milk`)).toEqual({ scope: `Tasks`, term: `milk` });
		expect(parseDeepSearch(`/s /ref plumber`)).toEqual({ scope: `References`, term: `plumber` });
		expect(parseDeepSearch(`/s /human teeth`)).toEqual({ scope: `Small Human`, term: `teeth` });
	});

	it(`is case-insensitive on both /s and the scope token`, () => {
		expect(parseDeepSearch(`/S /TASK milk`)).toEqual({ scope: `Tasks`, term: `milk` });
	});

	it(`treats an unrecognised token as literal search text, not a scope`, () => {
		expect(parseDeepSearch(`/s /nope milk`)).toEqual({ scope: null, term: `/nope milk` });
	});

	it(`returns an empty term when /s or /s /token is typed with nothing after`, () => {
		expect(parseDeepSearch(`/s`)).toEqual({ scope: null, term: `` });
		expect(parseDeepSearch(`/s /task`)).toEqual({ scope: `Tasks`, term: `` });
	});

	it(`trims surrounding whitespace`, () => {
		expect(parseDeepSearch(`  /s   /budget   nappies  `)).toEqual({ scope: `Budget`, term: `nappies` });
	});
});
