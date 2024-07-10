import type { TaskEvent } from "@ts/calendar"
import type { Task } from "@ts/tasks"

const parseTasks = (tasks: Task[]): TaskEvent[] => {
	const events: TaskEvent[] = tasks.map((task) => {
		const eventData: TaskEvent = {
			id: task.id,
			title: task.name,
			start: new Date(task.due),
			end: new Date(task.due),
			status: task.status,
			allDay: true,
			type: 'task'
		}

		return eventData
	})

	return events
}

export default parseTasks