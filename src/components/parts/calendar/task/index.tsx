import Modal from "@components/parts/modal"
import type { TaskEvent } from "@ts/calendar"
import { format } from "date-fns"

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