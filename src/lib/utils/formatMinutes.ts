import { intervalToDuration } from 'date-fns';

export function formatMinutes(mins: number | string | null): string {
	if (!mins) return ``;
	const m = typeof mins === `string` ? parseInt(mins, 10) : mins;
	if (isNaN(m) || m <= 0) return ``;
	const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
	if (hours && minutes) return `${hours}h ${minutes}m`;
	if (hours) return `${hours}h`;
	return `${minutes}m`;
}
