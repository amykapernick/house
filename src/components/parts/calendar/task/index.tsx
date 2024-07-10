import Modal from "@components/parts/Modal"
import type { TaskEvent } from "@ts/calendar"

const Task = (props: TaskEvent) => {
	const {title, start} = props
	return (
		<div>
			<span>✅ {title}</span>
			<Modal>
				Info about task 
			</Modal>
		</div>
	)
}

export default Task