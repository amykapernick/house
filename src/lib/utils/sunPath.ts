// Maps an instant onto a 0-1 fraction between two other instants - used to place a real,
// server-computed sun/moon elevation sample (see the `path` field on the GraphQL SunTimes type)
// onto the astro card's chart x-axis. Clamped since a dawn/dusk timestamp can fall slightly
// outside the sampled window.
export function mapTimeToX(iso: string, domainStartIso: string, domainEndIso: string): number {
	const start = new Date(domainStartIso).getTime();
	const end = new Date(domainEndIso).getTime();
	const t = new Date(iso).getTime();

	return Math.min(1, Math.max(0, (t - start) / (end - start)));
}
