export type UvBand = `low` | `moderate` | `high`;

export type UvBandInfo = {
	band: UvBand;
	label: string;
	colour: string;
};

// Matches the banding already used on the Home Assistant UV gauge card (0-3 low,
// 3-6 moderate, 6+ high) that this scale was originally lifted from.
const BANDS: { upTo: number; band: UvBand; label: string; colour: string }[] = [
	{ upTo: 3, band: `low`, label: `Low`, colour: `var(--success)` },
	{ upTo: 6, band: `moderate`, label: `Moderate`, colour: `var(--warning)` },
	{ upTo: Infinity, band: `high`, label: `High`, colour: `var(--error)` },
];

export function getUvBand(value: number): UvBandInfo {
	const { band, label, colour } = BANDS.find((b) => value < b.upTo) ?? BANDS[BANDS.length - 1];

	return { band, label, colour };
}
