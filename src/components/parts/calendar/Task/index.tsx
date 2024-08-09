import Modal from "@components/parts/Modal"
import type { TaskEvent } from "@ts/calendar"
import Todoist from '@img/icons/todoist.svg'
import Notion from '@img/icons/notion.svg'
import styles from './styles.module.css'
import type { TaskStatus } from "@ts/tasks"
import Checkbox from '@img/icons/checkbox.svg'
import Info from '@img/icons/info.svg'

const StatusComplete: Record<TaskStatus, string> = {
	'Not Started': 'incomplete',
	'In Progress': 'partial',
	'Ongoing': 'partial',
	'Paused': 'partial',
	'Done': 'complete',
}

const Task = (props: TaskEvent) => {
	const {title, start, link, platform, status, ...args} = props
	const completed = StatusComplete[status]

	return (
		<div className={styles.task}>
			<Checkbox
				className={`${styles.checkbox} ${styles[completed]}`}
			/>
			<span className={styles.title}>{title}</span>
			<a href={link} target="_blank" className={styles.link}>
				{platform === 'todoist' && <Todoist />}
				{platform === 'notion' && <Notion />}
				<span className="sr-only">Link to task "{title}"</span>
			</a>
		</div>
	)
}

export default Task