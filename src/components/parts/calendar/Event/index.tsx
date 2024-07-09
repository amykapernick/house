import type { Event as EventType } from "@ts/calendar"
import { format } from "date-fns"

const Event = (props: EventType) => {
	const {title, start} = props
	return (
		<div>
			<span>{title}</span>
			<span>{format(start, 'dd/MM/yyyy')}</span>
		</div>
	)
}

export default Event