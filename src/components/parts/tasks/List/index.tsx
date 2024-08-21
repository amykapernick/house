import TaskCard from "@components/parts/tasks/Task"
import styles from './styles.module.css'
import type { Task } from "@ts/tasks"

type TaskViewProps = {
	tasks: Task[]
}

const TaskList = (props: TaskViewProps) => {
	const { tasks = [] } = props
	return (
		<ul className={styles.list}>
			{tasks.map(task => (
				<li className={styles.item} key={task.id}>
					<TaskCard {...task} />				
				</li>
			))}
		</ul>
	)
}

export default TaskList