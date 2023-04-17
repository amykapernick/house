import { useRef, useState } from "react";
import type { Task } from "@react/tasks/list";

type AddTaskProps = {
	tasks: Task[];
	updateTasks: (tasks: Task[]) => void;
}

const AddTask = (props) => {
	const {tasks, updateTasks} = props
	const nameField = useRef()
	const dateField = useRef()
	const [open, setOpen] = useState(false);
	const handleAddTask = (e) => {
		e.preventDefault();

		const newTask = {
			name: nameField.current.value,
			id: generateId(),
			completed: false,
			due: dateField.current.value ? new Date(dateField.current.value) : null,
		}
	
		updateTasks([...tasks, newTask]);
		setOpen(false);
	  };

	return (
		<>
			<button onClick={() => setOpen(true)}>Add a Task</button>
			{open && (
				<div className="popup">
					<form onSubmit={handleAddTask}>
						<label htmlFor="add_task">Task Name</label>
						<input
							type="text" 
							id="add_task" 
							ref={nameField}
						/>
						<label htmlFor="due_date">Due Date</label>
						<input
							type="date"
							id="due_date"
							ref={dateField}
						/>
						<button type="submit">Add</button>
						<button type="button" onClick={() => setOpen(false)}>
							Cancel
						</button>
					</form>
				</div>
			)}
	  </>
	)
}

// generate a unique id string
const generateId = () =>  Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);


export default AddTask