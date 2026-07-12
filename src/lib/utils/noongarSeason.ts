// Noongar calendar (south-west Western Australia) - mirrors the season table
// in household_api's smallHumanTracker, kept as an independent client-side
// copy since this page needs the lookup without a round-trip to the API.
const NOONGAR_SEASONS = [
	{ name: `Birak`, months: [12, 1] },
	{ name: `Bunuru`, months: [2, 3] },
	{ name: `Djeran`, months: [4, 5] },
	{ name: `Makuru`, months: [6, 7] },
	{ name: `Djilba`, months: [8, 9] },
	{ name: `Kambarang`, months: [10, 11] },
];

export function getCurrentNoongarSeason(referenceDate: Date = new Date()): string {
	const month = referenceDate.getMonth() + 1;
	return NOONGAR_SEASONS.find((season) => season.months.includes(month))!.name;
}
