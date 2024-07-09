import Event from "../Event"
import Task from "../task"

const CustomEvent = ({event}) => {
	return (
		<>
			{event.type === 'task' && <Task {...event} />}
			{event.type === 'event' && <Event {...event} />}
		</>
	)
  }

  export default CustomEvent