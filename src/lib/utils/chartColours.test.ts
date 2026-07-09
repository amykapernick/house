import { describe, it, expect } from 'vitest';
import { categoricalColour, OTHER_COLOUR, topNPlusOther } from './chartColours';

describe(`categoricalColour`, () => {
	it(`returns the colour at the given index`, () => {
		expect(categoricalColour(0)).toBe(`purple_bright`);
	});

	it(`falls back to OTHER_COLOUR for an out-of-range index`, () => {
		expect(categoricalColour(100)).toBe(OTHER_COLOUR);
	});

	it(`falls back to OTHER_COLOUR for a negative index`, () => {
		expect(categoricalColour(-1)).toBe(OTHER_COLOUR);
	});
});

describe(`topNPlusOther`, () => {
	const makeOther = (value: number, rest: { value: number }[]) => ({ value, label: `Other`, rest });

	it(`returns items unchanged, in original order, when at or under the limit`, () => {
		const items = [{ value: 1 }, { value: 3 }, { value: 2 }];

		expect(topNPlusOther(items, makeOther, 3)).toEqual(items);
	});

	it(`keeps the top n by value descending and folds the remainder into one "other" entry`, () => {
		const items = [{ value: 1 }, { value: 5 }, { value: 3 }, { value: 2 }];

		const result = topNPlusOther(items, makeOther, 2);

		expect(result).toEqual([{ value: 5 }, { value: 3 }, { value: 3, label: `Other`, rest: [{ value: 2 }, { value: 1 }] }]);
	});

	it(`drops the "other" bucket entirely when the remainder sums to 0`, () => {
		const items = [{ value: 5 }, { value: 3 }, { value: 0 }, { value: 0 }];

		const result = topNPlusOther(items, makeOther, 2);

		expect(result).toEqual([{ value: 5 }, { value: 3 }]);
	});

	it(`defaults n to the full categorical order length (7)`, () => {
		const items = Array.from({ length: 7 }, (_, i) => ({ value: i + 1 }));

		expect(topNPlusOther(items, makeOther)).toEqual(items);
	});
});
