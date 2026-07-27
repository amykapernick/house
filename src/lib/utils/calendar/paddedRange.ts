export type DateRange = { start: Date; end: Date };

// Padded window = the visible span plus one visible-span's worth of padding on
// each side (e.g. a visible week fetches 3 weeks; a visible month fetches 3
// months) - centered on what's actually on screen, so navigating a step or two
// either way usually still falls inside data that's already been fetched.
export function computePaddedRange(visible: DateRange): DateRange {
	const spanMs = visible.end.getTime() - visible.start.getTime();

	return {
		start: new Date(visible.start.getTime() - spanMs),
		end: new Date(visible.end.getTime() + spanMs),
	};
}

// True when `visible` isn't fully contained in the last-fetched padded range
// (or nothing's been fetched yet) - i.e. it's time to fetch a new padded window.
export function needsRefetch(visible: DateRange, lastFetchedPadded: DateRange | null): boolean {
	if (!lastFetchedPadded) return true;

	return visible.start < lastFetchedPadded.start || visible.end > lastFetchedPadded.end;
}
