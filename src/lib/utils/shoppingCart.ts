// Per-device shopping cart for /shopping-list/cart - tracks what's actually gone
// into the trolley (with qty/price) while shopping, separate from the shopping
// list itself. Deliberately localStorage only, no API/data store: it's a
// disposable session (cleared once the shop's done), not data worth round-tripping.
const STORAGE_KEY = `shopping-cart`;

export interface CartItem {
	id: string
	name: string
	qty: number
	price: number
	matchedItemId?: string
	addedAt: number
}

export function getCartItems(): CartItem[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	}
	catch {
		return [];
	}
}

function saveCartItems(items: CartItem[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}
	catch {}
}

export function addCartItem(item: Omit<CartItem, `id` | `addedAt`>): CartItem[] {
	const items = [...getCartItems(), { ...item, id: crypto.randomUUID(), addedAt: Date.now() }];
	saveCartItems(items);
	return items;
}

export function removeCartItem(id: string): CartItem[] {
	const items = getCartItems().filter((item) => item.id !== id);
	saveCartItems(items);
	return items;
}

export function clearCartItems(): CartItem[] {
	saveCartItems([]);
	return [];
}
