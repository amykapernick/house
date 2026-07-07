import { add, isMatch } from 'date-fns';
import type { TaskEvent } from '$types/calendar';
import type { Task } from '$types/tasks';

const parseTasks = (tasks: Task[]): TaskEvent[] => {
	const events: TaskEvent[] = tasks
		.filter((task) => task.due)
		.map((task) => {
			const eventData: TaskEvent = {
				id: task.id,
				title: task.name,
				status: task.status,
				type: `task`,
				link: task.link,
				platform: task.platform,
				resource: task.assigned,
				allDay: false,
				start: new Date(task.due),
				end: task.estimate
					? add(new Date(task.due), { hours: task.estimate })
					: add(new Date(task.due), { minutes: 15 }),
			};

			if (isMatch(task.due as unknown as string, `yyyy-MM-dd`)) {
				eventData.allDay = true;
			}

			return eventData;
		});

	return events;
};

export default parseTasks;
