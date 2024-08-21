import TaskCard from "@components/parts/tasks/Task"
import styles from './styles.module.css'
import type { Task } from "@ts/tasks"
import type { CSSProperties } from "react"

type TaskViewProps = {
	tasks: Task[]
}

const TaskBoard = (props: TaskViewProps) => {
	const { tasks = [] } = props
	const parsedTasks: Record<string, Task[]> = {}

	tasks.forEach(task => {
		if(!parsedTasks[task.status]) parsedTasks[task.status] = []

		parsedTasks[task.status].push(task)
	})

	return (
		<div className={styles.board} style={{'--columns': Object.keys(parsedTasks).length } as CSSProperties}>
			{Object.entries(parsedTasks).map(([status, tasks]) => (
				<div className={styles.column} key={status}>
					<h2>{status}</h2>
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

export default TaskBoard