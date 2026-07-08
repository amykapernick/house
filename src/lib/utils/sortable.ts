export type SortDirection = `asc` | `desc`;

export function compareValues(a: string | number | null, b: string | number | null, dir: SortDirection): number {
	const mult = dir === `asc` ? 1 : -1;

	if (a == null) return b == null ? 0 : 1;
	if (b == null) return -1;
	if (typeof a === `string` && typeof b === `string`) return a.localeCompare(b) * mult;

	return ((a as number) - (b as number)) * mult;
}
