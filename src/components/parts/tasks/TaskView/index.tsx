'use client'

import type { Task } from "@ts/tasks"
import styles from './styles.module.css'
import { useState } from "react"
import TaskList from "@parts/tasks/List"
import TaskBoard from '@parts/tasks/Kanban'
import TaskCalendar from '@parts/tasks/Calendar'

type TaskViewProps = {
	tasks: Task[]
}

type TaskViewType = 'list' | 'kanban' | 'calendar'

const views: Record<TaskViewType, {
	component: React.ComponentType<TaskViewProps> | any,
	name: string
}> = {
	list: {
		component: TaskList,
		name: 'List',
	},
	kanban: {
		component: TaskBoard,
		name: 'Kanban',
	},
	calendar: {
		component: TaskCalendar,
		name: 'Calendar',
	},
}

const TaskView = (props: TaskViewProps) => {
	const { tasks = [] } = props
	const [view, setView] = useState<TaskViewType>('calendar')
	const ViewComponent = views[view].component

	return (
		<div>
			<nav className={styles.switcher}>
				{Object.entries(views).map(([viewType, {name}]) => (
					<button
						key={viewType}
						onClick={() => setView(viewType as TaskViewType)}
						data-active={view === viewType}
					>
						{name}
					</button>
				))}
			</nav>
			<ViewComponent tasks={tasks} />
		</div>
	)
}

export default TaskView