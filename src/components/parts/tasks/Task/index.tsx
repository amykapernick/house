import { format } from "date-fns"
import Checkbox from '@img/icons/checkbox.svg'
import Assignees from "@parts/tasks/Assigned"
import styles from './styles.module.css'
import type { Task, TaskStatus } from "@ts/tasks"

type TaskCardProps = Task & {

}

const StatusComplete: Record<TaskStatus, string> = {
	'Not Started': `incomplete`,
	'In Progress': `partial`,
	'Ongoing': `partial`,
	'Paused': `partial`,
	'Done': `complete`,
}

const TaskCard = (props: TaskCardProps) => {
	const { name, status, due, assigned} = props
	const completed = StatusComplete[status]

	return (
		<div className={styles.task}>
			<Checkbox
				className={`${styles.checkbox} ${styles[completed]}`}
			/>
			<span className={styles.name}>{name}</span>
			<span className={styles.status} data-status={status.replaceAll(` `, `-`).toLowerCase()}>{status}</span>
			{due && <span className={styles.due}>{due && format(due, `dd MMM`)}</span>}
			{assigned && <Assignees className={styles.assigned} assignees={assigned} />}
		</div>
	)
}

export default TaskCard