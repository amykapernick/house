import { format } from 'date-fns';
import fetchClientData from './fetchClientData';
import { DATE_FORMATS } from './dateFormats';
import type { Chore } from '$types/chores';

type FetchChoresDataProps = {
	/** Called immediately with cached chores if available; the promise still resolves with fresh data. */
	onStale?: (chores: Chore[]) => void
};

export default async function fetchChoresData(props: FetchChoresDataProps = {}): Promise<Chore[]> {
	const { onStale } = props;
	const today = format(new Date(), DATE_FORMATS.iso);

	const res = await fetchClientData({
		cacheKey: `chores-${today}`,
		onStale: (data) => onStale?.(data.chores ?? []),
		gqlQuery: `
			query {
				chores(today: "${today}") {
					id
					name
					due
					recurrence
					isRecurring
					labels
					upcoming
					durationMinutes
				}
			}
		`,
	});

	return res.chores ?? [];
}
