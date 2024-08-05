import TaskCard from "@components/parts/tasks/Task"
import type { Task } from "@ts/tasks"
import styles from './styles.module.css'
import { add, format, isBefore } from "date-fns"

type TaskViewProps = {
	tasks: Task[]
}

const TaskCalendar = (props: TaskViewProps) => {
	const { tasks = [] } = props
	const parsedTasks: Record<string, Task[]> = {}
	const today = new Date()

	tasks
		.filter(({due}) => due)
		.filter(({due, status}) => !(status === 'Done' && isBefore(new Date(due), today)))
		.filter(task => {
			const due = new Date(task.due)

			return isBefore(due, today) || isBefore(due, add(today, {days: 7}))
		})
		.sort((a, b) => new Date(a.due) - new Date(b.due))
		.forEach(task => {
			const due = new Date(task.due) < today ? 'Overdue' : format(new Date(task.due), 'dd-MMM-yyyy')
			if(!parsedTasks[due]) parsedTasks[due] = []
	
			parsedTasks[due].push(task)
		})

	return (
		<div className={styles.board} style={{'--columns': Object.keys(parsedTasks).length } as CSSProperties}>
			{Object.entries(parsedTasks).map(([due, tasks]) => (
				<div className={styles.column} key={due}>
					<h2>{due}</h2>
					<ul className={styles.list}>
						{tasks.map(task => (
							<li className={styles.item} key={task.id}>
								<TaskCard {...task} />				
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	)
}

export default TaskCalendar