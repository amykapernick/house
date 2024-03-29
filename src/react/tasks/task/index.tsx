import { format, isBefore, isSameDay } from 'date-fns';
import styles from './styles.module.css'
import EditTask from '@react/tasks/editTask';
import DeleteTask from '@react/tasks/deletetask';

export type TaskType = {
	id: string;
	name: string;
	completed: boolean;
	due?: Date;
}

type TypeProps = TaskType & {
	updateTasks: (tasks: TaskType[]) => void;
	tasks: TaskType[];
}

const Task = (props: TypeProps) => {
	const {id, name, completed, due, updateTasks, tasks} = props

	const handleCompletion = (id: string) => {
		const updatedTasks = tasks.map((task) => {
			if (id === task.id) {
			task.completed = !task.completed;
			}
			return task;
		});

		updateTasks(updatedTasks);
	}

	return (
		<li className={styles.task}>
			<input
				type="checkbox" 
				name={id} 
				id={`task_${id}`} 
				defaultChecked={completed}
				onChange={() => handleCompletion(id)}
				className={styles.checkbox}
			/>
			<label className={styles.label} htmlFor={`task_${id}`}>
				{name} 
			</label>
			{due && 
				<span
					className={styles.due}
					data-overdue={
						isBefore(new Date(due), new Date()) && 
						!isSameDay(new Date(due), new Date())
					}
				>
					(Due: {format(new Date(due), 'dd MMM')})
				</span>
			}
			<span className={styles.controls}>
				<EditTask
					tasks={tasks}
					updateTasks={updateTasks}
					task={{id, name, due, completed}}
				/>
				<DeleteTask
					tasks={tasks}
					updateTasks={updateTasks}
					task={{id, name, due, completed}}
				/>
			</span>
		</li>
	)
}

export default Task