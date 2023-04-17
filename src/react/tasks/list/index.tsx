import { useEffect, useState } from 'react';
import AddTask from '@react/tasks/addTask';
import { format } from 'date-fns';
import SVG from 'react-inlinesvg';
import Close from '@img/icons/close.svg'

import styles from './styles.module.css'

export type Task = {
	id: string;
	name: string;
	completed: boolean;
	due?: Date;
}

const List = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const updateTasks = (newTasks: Task[]) => {
		setTasks(newTasks);
		localStorage.setItem('tasks', JSON.stringify(newTasks));
	}
	const deleteTask = (id: string) => {
	updateTasks(tasks.filter((task) => id !== task.id))
	};
	const handleCompletion = (id: string) => {
		const updatedTasks = tasks.map((task) => {
			if (id === task.id) {
			task.completed = !task.completed;
			}
			return task;
		});

		updateTasks(updatedTasks);
	}

	useEffect(() => {
		const localTasks = localStorage.getItem('tasks');

		if (localTasks) {
			setTasks(JSON.parse(localTasks));
		}
	}, [])

	return (
		<>
			<AddTask {...{tasks, updateTasks}} />
			<ul>
				{tasks.map(({id, name, completed, due}) => (
					<li key={id}>
						<input
							type="checkbox" 
							name={id} 
							id={`task_${id}`} 
							defaultChecked={completed}
							onChange={() => handleCompletion(id)}
							className={styles.checkbox}
						/>
						<label className={styles.task} htmlFor={`task_${id}`}>
							{name} {due && <span>(Due: {format(new Date(due), 'dd MMM')})</span>}
						</label>
						<button className={styles.delete} onClick={() => deleteTask(id)}>
							<span className="sr-only">Delete</span>
							<SVG src={Close.src} />
						</button>
					</li>
				))}
			</ul>
		</>
	);
}

export default List;
