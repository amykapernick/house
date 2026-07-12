import type { TaskEvent } from '$types/calendar';
import type { Task } from '$types/tasks';

// A task assigned to exactly one family member takes that person's colour;
// a task assigned to more than one (which, per the API's fallback, means
// "assigned to no one in particular" as much as an actual multi-assign)
// takes the shared household colour instead.
const EVERYONE_COLOUR = `kapers-crewe`;

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
			colour: task.assigned.length === 1 ? task.assigned[0].colour : EVERYONE_COLOUR,
		}));

	return events;
};

export default parseTasks;
