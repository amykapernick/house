// Periods per year, not months-per-period approximations (e.g. fortnightly
// isn't *4/month - there are 26 fortnights in a year, so *26/12/month).
const PERIODS_PER_YEAR: Record<string, number> = {
	Week: 52,
	Fortnight: 26,
	Month: 12,
	Year: 1,
};

export const monthlyAmount = (amount?: number, period?: string): number | null => {
	if (amount == null) return null;
	const periodsPerYear = (period && PERIODS_PER_YEAR[period]) || PERIODS_PER_YEAR.Month;
	return (amount * periodsPerYear) / 12;
};
