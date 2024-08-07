import type { Event as EventType } from "@ts/calendar"
import { format } from "date-fns"
import styles from './styles.module.css'

const Event = (props: EventType) => {
	const {title, start, allDay} = props
	return (
		<div className={styles.event}>
			<span className={styles.title}>{title}</span>
			{allDay && <span className={styles.time}>
				{format(start, 'hh:MM aaa')}
			</span>}
		</div>
	)
}

export default Event