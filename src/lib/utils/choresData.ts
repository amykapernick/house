import { format } from 'date-fns';
import fetchClientData from './fetchClientData';
import type { Chore } from '$types/chores';

type FetchChoresDataProps = {
	/** Called immediately with cached chores if available; the promise still resolves with fresh data. */
	onStale?: (chores: Chore[]) => void
};

export default async function fetchChoresData(props: FetchChoresDataProps = {}): Promise<Chore[]> {
	const { onStale } = props;
	const today = format(new Date(), `yyyy-MM-dd`);

	const res = await fetchClientData({
		cacheKey: `chores-${today}`,
		onStale: (data) => onStale?.(data.chores ?? []),
		gqlQuery: `
			query {
				chores {
					id
					name
					due
					recurrence
					isRecurring
					labels
				}
			}
		`,
	});

	return res.chores ?? [];
}
