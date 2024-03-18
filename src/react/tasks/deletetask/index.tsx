import { useState } from "react";
import type { SyntheticEvent } from "react";
import type { TaskType as Task } from "@react/tasks/task";
import Close from '@img/icons/close.svg?url'
import SVG from 'react-inlinesvg';
import styles from './styles.module.css'
import {format} from 'date-fns'

type DeleteTaskProps = {
	tasks: Task[];
	updateTasks: (tasks: Task[]) => void;
	task: Task;
}

const DeleteTask = (props: DeleteTaskProps) => {
	const { tasks, updateTasks, task } = props
	const [open, setOpen] = useState(false);
	const handleDeleteTask = (e: SyntheticEvent) => {
		e.preventDefault();

		updateTasks(tasks.filter((t) => task.id !== t.id))

		setOpen(false);
	  };

	return (
		<>
			<button className={styles.button} onClick={() => setOpen(true)}>
				<span className="sr-only">Delete</span>
				<SVG src={Close} />
			</button>
			{open && (
				<div className={styles.popup}>
					<h3 className={styles.heading}>Delete Task</h3>
					<form className={styles.form} onSubmit={handleDeleteTask}>
						<legend>Are you sure you want to delete <em>{task.name}</em>?</legend>
						<footer>
							<button type="button" onClick={() => setOpen(false)}>
								Cancel
							</button>
							<button type="submit">Delete Task</button>
						</footer>
					</form>
				</div>
			)}
		</>
	)
}


export default DeleteTask