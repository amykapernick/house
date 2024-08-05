import TaskCard from "@components/parts/tasks/Task"
import type { Task } from "@ts/tasks"
import styles from './styles.module.css'

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