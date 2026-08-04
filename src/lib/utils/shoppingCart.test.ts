import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCartItems, addCartItem, removeCartItem, clearCartItems } from './shoppingCart';

describe(`shoppingCart`, () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it(`returns an empty array when nothing has been added`, () => {
		expect(getCartItems()).toEqual([]);
	});

	it(`adds an item with a generated id and timestamp`, () => {
		const items = addCartItem({ name: `Milk`, qty: 2, price: 3.5 });

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ name: `Milk`, qty: 2, price: 3.5 });
		expect(items[0].id).toBeTruthy();
		expect(items[0].addedAt).toBeTypeOf(`number`);
		expect(getCartItems()).toEqual(items);
	});

	it(`preserves an optional matchedItemId`, () => {
		const items = addCartItem({ name: `Bread`, qty: 1, price: 4, matchedItemId: `item-1` });

		expect(items[0].matchedItemId).toBe(`item-1`);
	});

	it(`removes an item by id, leaving the rest`, () => {
		addCartItem({ name: `Milk`, qty: 2, price: 3.5 });
		const [, second] = addCartItem({ name: `Bread`, qty: 1, price: 4 });

		const items = removeCartItem(second.id);

		expect(items).toEqual([expect.objectContaining({ name: `Milk` })]);
	});

	it(`clears every item`, () => {
		addCartItem({ name: `Milk`, qty: 2, price: 3.5 });
		addCartItem({ name: `Bread`, qty: 1, price: 4 });

		expect(clearCartItems()).toEqual([]);
		expect(getCartItems()).toEqual([]);
	});

	it(`returns an empty array when localStorage.getItem throws`, () => {
		vi.spyOn(Storage.prototype, `getItem`).mockImplementation(() => {
			throw new Error(`storage disabled`);
		});

		expect(getCartItems()).toEqual([]);

		vi.restoreAllMocks();
	});

	it(`silently no-ops when localStorage.setItem throws`, () => {
		vi.spyOn(Storage.prototype, `setItem`).mockImplementation(() => {
			throw new Error(`quota exceeded`);
		});

		expect(() => addCartItem({ name: `Milk`, qty: 1, price: 1 })).not.toThrow();

		vi.restoreAllMocks();
	});
});
