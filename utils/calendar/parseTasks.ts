import type { TaskEvent } from "@ts/calendar"
import type { Task } from "@ts/tasks"
import { add, isMatch } from "date-fns"

const parseTasks = (tasks: Task[]): TaskEvent[] => {
	const events: TaskEvent[] = tasks?.map((task) => {
		let eventData: TaskEvent = {
			id: task.id,
			title: task.name,
			status: task.status,
			type: 'task',
			link: task.link,
			platform: task.platform,
			resource: task.assigned,
		}

		if(task.due) {
			eventData.start = new Date(task.due)
			eventData.end = task.estimate ? add(new Date(task.due), {hours: task.estimate}) : add(new Date(task.due), {minutes: 15})

			if(isMatch(task.due, 'yyyy-MM-dd')) {
				eventData.allDay = true
			}
		}

		return eventData
	})

	return events
}

export default parseTasks