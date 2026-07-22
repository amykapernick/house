// Standard date-fns format strings for dates handled throughout the app. Use these instead of
// ad-hoc format strings or toLocaleDateString so date formatting stays consistent.
export const DATE_FORMATS = {
	/** e.g. "3 Jul" - compact display label without a year, for recent/relative dates */
	short: `d MMM`,
	/** e.g. "3 Jul 2026" - full display date, for dates that may be far in the past or future */
	full: `d MMM yyyy`,
	/** e.g. "2026-07-03" - date-only key, for cache keys, API args and day comparisons */
	iso: `yyyy-MM-dd`,
	month: `MMM yyyy`
} as const;
