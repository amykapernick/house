import { SyntheticEvent, useRef, useState } from "react";
import type { EventType as Event } from "@react/calendar/event";
import Close from '@img/icons/close.svg?url'
import SVG from 'react-inlinesvg';
import styles from './styles.module.css'

type DeleteEventProps = {
	events: Event[];
	updateEvents: (events: Event[]) => void;
	event: Event;
}

const DeleteEvent = (props: DeleteEventProps) => {
	const { events, updateEvents, event } = props
	const [open, setOpen] = useState(false);
	const handleDeleteEvent = (e: SyntheticEvent) => {
		e.preventDefault();

		updateEvents(events.filter((t) => event.id !== t.id))

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
					<h3 className={styles.heading}>Delete Event</h3>
					<form className={styles.form} onSubmit={handleDeleteEvent}>
						<legend>Are you sure you want to delete <em>{event.name}</em>?</legend>
						<footer>
							<button type="button" onClick={() => setOpen(false)}>
								Cancel
							</button>
							<button type="submit">Delete Event</button>
						</footer>
					</form>
				</div>
			)}
		</>
	)
}


export default DeleteEvent