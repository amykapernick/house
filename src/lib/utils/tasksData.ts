import { format } from 'date-fns';
import fetchClientData from './fetchClientData';
import { DATE_FORMATS } from './dateFormats';
import isStaleCompletedTask from './isStaleCompletedTask';
import type { Task } from '$types/tasks';

type FetchTasksDataProps = {
	/** Called immediately with cached tasks if available; the promise still resolves with fresh data. */
	onStale?: (tasks: Task[]) => void
};

// Shared by the tasks page and the reminder checker so both read/write the same
// cache entry instead of maintaining two separate queries against the same key.
export default async function fetchTasksData(props: FetchTasksDataProps = {}): Promise<Task[]> {
	const { onStale } = props;
	const today = format(new Date(), DATE_FORMATS.iso);

	const res = await fetchClientData({
		cacheKey: `tasks-${today}`,
		onStale: (data) => onStale?.((data.tasks ?? []).filter((task: Task) => !isStaleCompletedTask(task))),
		gqlQuery: `
			query {
				tasks {
					id
					name
					assigned {
						slug
						name
						profile
					}
					status
					due
					allDay
					platform
					link
					dueLabel(today: "${today}")
					project {
						name
					}
					updatedAt
				}
			}
		`,
	});

	return (res.tasks ?? []).filter((task: Task) => !isStaleCompletedTask(task));
}
