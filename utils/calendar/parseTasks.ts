import { add, format } from "date-fns"
import type { Event } from "@ts/calendar"
import type { Task } from "@ts/tasks"

const parseTasks = (tasks: Task[]): Event[] => {
	const events: Event[] = tasks.map((task) => {
		const eventData: Event = {
			id: task.id,
			title: task.name,
			start: new Date(task.due),
			end: new Date(task.due),
			allDay: true,
			type: 'task'
		}

		return eventData
	})

	return events
}

export default parseTasks