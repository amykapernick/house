import { useEffect, useState } from 'react';
import AddTask from '@react/tasks/addTask';
import Task from '@react/tasks/task'
import type { TaskType } from '@react/tasks/task';

import styles from './styles.module.css'
import orderTasks from '@utils/tasks/orderTasks';

const List = () => {
	const [tasks, setTasks] = useState<TaskType[]>([]);
	const updateTasks = (newTasks: TaskType[]) => {
		setTasks(orderTasks({tasks: newTasks}));
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	}
	
	useEffect(() => {
		const localTasks = localStorage.getItem('tasks');

		if (localTasks) {
			setTasks(orderTasks({tasks: JSON.parse(localTasks)}));
		}
	}, [])

	return (
		<>
			<AddTask {...{tasks, updateTasks}} />
			<ul className={styles.list}>
				{tasks.map((task) => (
					<Task
						key={task.id}
						{...task}
						updateTasks={updateTasks}
						tasks={tasks}
					/>	
				))}
			</ul>
		</>
	);
}

export default List;
