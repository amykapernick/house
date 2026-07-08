import type { TaskEvent } from '$types/calendar';
import type { Task } from '$types/tasks';

const parseTasks = (tasks: Task[]): TaskEvent[] => {
	const events: TaskEvent[] = tasks
		.filter((task) => task.due)
		.map((task) => ({
			id: task.id,
			title: task.name,
			status: task.status,
			type: `task`,
			link: task.link,
			platform: task.platform,
			resource: task.assigned,
			allDay: task.allDay ?? false,
			start: new Date(task.due),
			end: new Date(task.end ?? task.due),
		}));

	return events;
};

export default parseTasks;
