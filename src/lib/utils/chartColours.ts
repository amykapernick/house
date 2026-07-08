import type { Colour } from '$types/global';

// Fixed categorical order for charts - validated with the dataviz palette
// validator for CVD-safe adjacent separation and contrast against the app's
// surface colours. Deliberately skips red/orange/green, which are reserved
// for status (--error/--warning/--success).
const CATEGORICAL_ORDER: Colour[] = [
	`purple_bright`,
	`blue_mid`,
	`orange_dark`,
	`blue_navy`,
	`pink`,
	`yellow`,
	`purple`,
];

export const OTHER_COLOUR: Colour = `grey_light`;

export const categoricalColour = (index: number): Colour =>
	CATEGORICAL_ORDER[index] ?? OTHER_COLOUR;

export const OTHER_LABEL = `Other`;

// Keeps the top `n` entries by value (descending) and folds the remainder
// into a single "Other" entry, so a chart never has to reach past the fixed
// categorical order for a colour.
export function topNPlusOther<T extends { value: number }>(
	items: T[],
	makeOther: (value: number, rest: T[]) => T,
	n: number = CATEGORICAL_ORDER.length
): T[] {
	if (items.length <= n) return items;

	const sorted = [...items].sort((a, b) => b.value - a.value);
	const top = sorted.slice(0, n);
	const rest = sorted.slice(n);
	const otherValue = rest.reduce((sum, item) => sum + item.value, 0);

	return otherValue > 0 ? [...top, makeOther(otherValue, rest)] : top;
}
