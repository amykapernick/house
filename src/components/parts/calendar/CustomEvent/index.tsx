import Event from "../Event"
import Task from "../task"
import type { Event as EventType, TaskEvent } from '@ts/calendar'

const CustomEvent = ({event}: {event: EventType}) => {
	return (
		<>
			{event.type === 'task' && <Task {...event as TaskEvent} />}
			{event.type === 'event' && <Event {...event} />}
		</>
	)
  }

  export default CustomEvent