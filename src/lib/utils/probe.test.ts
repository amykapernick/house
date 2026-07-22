import { describe, it, expect } from 'vitest';
import { filterResults } from './searchResults';
describe('probe', () => {
	it('works', () => {
		expect(filterResults('a', [{ name: 'abc' }], (x) => ({ key: x.name, label: x.name, section: 'Pages' }))).toHaveLength(1);
	});
});
