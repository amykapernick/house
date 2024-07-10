import { isBefore } from 'date-fns';
import type { Task } from "@ts/tasks";

type Props = {
	tasks: Task[]
}

const orderTasks = (props: Props) => {
	const sortedTasks: Task[] = props.tasks.toSorted((a: Task, b: Task) => {
		if(!a?.due) return 1;
		if(!b?.due) return -1;
		
		if (a.due && b.due) return isBefore(new Date(a.due), new Date(b.due)) ? -1 : 1;

		return 0;
	})

	return sortedTasks
}

export default orderTasks    