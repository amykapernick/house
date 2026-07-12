import { describe, it, expect } from 'vitest';
import { isVisibleToUser, EVERYONE } from './fetchFamilyMembers';

describe(`isVisibleToUser`, () => {
	it(`is always visible when EVERYONE is selected, regardless of members`, () => {
		expect(isVisibleToUser([], EVERYONE)).toBe(true);
		expect(isVisibleToUser(null, EVERYONE)).toBe(true);
		expect(isVisibleToUser([{ slug: `amy` }], EVERYONE)).toBe(true);
	});

	it(`is visible when the selected user is among the members`, () => {
		expect(isVisibleToUser([{ slug: `amy` }, { slug: `dan` }], `dan`)).toBe(true);
	});

	it(`is not visible when the selected user isn't among the members`, () => {
		expect(isVisibleToUser([{ slug: `amy` }], `dan`)).toBe(false);
	});

	it(`is not visible when members is empty or missing and a specific user is selected`, () => {
		expect(isVisibleToUser([], `dan`)).toBe(false);
		expect(isVisibleToUser(null, `dan`)).toBe(false);
		expect(isVisibleToUser(undefined, `dan`)).toBe(false);
	});
});
