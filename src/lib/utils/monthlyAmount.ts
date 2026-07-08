// Mirrors household_api's src/utils/budget/monthlyAmount.ts formula - needed
// here so amounts/totals update live while editing, before a save round-trips
// through the server (which remains the source of truth for the stored value).
// Periods per year, not months-per-period approximations (e.g. fortnightly
// isn't *4/month - there are 26 fortnights in a year, so *26/12/month).
const PERIODS_PER_YEAR: Record<string, number> = {
	Week: 52,
	Fortnight: 26,
	Month: 12,
	Year: 1,
};

const monthlyAmount = (amount?: number | null, period?: string | null): number | null => {
	if (amount == null) return null;
	const periodsPerYear = (period && PERIODS_PER_YEAR[period]) || PERIODS_PER_YEAR.Month;
	return (amount * periodsPerYear) / 12;
};

export default monthlyAmount;
