import { format } from 'date-fns';
import fetchClientData from './fetchClientData';
import { DATE_FORMATS } from './dateFormats';
import type { Habit } from '$types/habits';

type FetchHabitsDataProps = {
	/** Called immediately with cached habits if available; the promise still resolves with fresh data. */
	onStale?: (habits: Habit[]) => void
};

export default async function fetchHabitsData(props: FetchHabitsDataProps = {}): Promise<Habit[]> {
	const { onStale } = props;
	const today = format(new Date(), DATE_FORMATS.iso);

	const res = await fetchClientData({
		cacheKey: `habits-${today}`,
		onStale: (data) => onStale?.(data.habits ?? []),
		gqlQuery: `
			query {
				habits {
					id
					name
					due
					recurrence
					recurrenceInterval {
						count
						unit
					}
					streak
					lastCompleted
					link
					assigned {
						slug
						name
						profile
					}
					completions
				}
			}
		`,
	});

	return res.habits ?? [];
}
