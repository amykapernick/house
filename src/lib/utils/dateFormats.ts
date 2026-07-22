// Standard date-fns format strings for displaying dates to the user. Use these instead of
// ad-hoc format strings or toLocaleDateString so date display stays consistent across the app.
export const DATE_FORMATS = {
	/** e.g. "3 Jul" - compact label without a year, for recent/relative dates */
	short: `d MMM`,
	/** e.g. "3 Jul 2026" - full display date, for dates that may be far in the past or future */
	full: `d MMM yyyy`,
} as const;
