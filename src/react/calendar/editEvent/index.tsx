import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import type { EventType as Event } from "@react/calendar/event";
import Edit from '@img/icons/edit.svg?url'
import SVG from 'react-inlinesvg';
import styles from './styles.module.css'
import { format } from 'date-fns'

type EditEventProps = {
	events: Event[];
	updateEvents: (events: Event[]) => void;
	event: Event;
}

const EditEvent = (props: EditEventProps) => {
	const { events, updateEvents, event } = props
	const nameField = useRef<HTMLInputElement>(null)
	const startField = useRef<HTMLInputElement>(null)
	const endField = useRef<HTMLInputElement>(null)
	const [startDate, setStart] = useState<string>(format(new Date(event.start), 'yyyy-MM-dd'))
	const [endDate, setEnd] = useState<string | undefined>(event?.end && format(new Date(event.end), 'yyyy-MM-dd'))
	const [open, setOpen] = useState(false);
	const handleEditEvent = (e: SyntheticEvent) => {
		e.preventDefault();

		if(!nameField?.current) return;
		if(!startField?.current) return;

		const updatedEvent: Event = {
			...event,
			name: nameField.current?.value,
			start: new Date(startField.current.value),
		}

		if(endField?.current?.value) {
			if(endField.current.value == startField.current.value) {
				updatedEvent.end = undefined
			}
			else {
				updatedEvent.end = new Date(endField.current.value);
			}
		}
	
		updateEvents(events.map(t => {
			if(t.id === event.id) {
				return updatedEvent
			}
			return t
		}));
		setOpen(false);
	  };

	return (
		<>
			<button className={styles.button} onClick={() => setOpen(true)}>
				<span className="sr-only">Edit</span>
				<SVG src={Edit} />
			</button>
			{open && (
				<div className={styles.popup}>
					<h3 className={styles.heading}>Edit Event</h3>
					<form className={styles.form} onSubmit={handleEditEvent}>
					<label htmlFor="add_event">Event Name</label>
						<input
							type="text" 
							id="add_event" 
							ref={nameField}
							required={true}
							defaultValue={event.name}
						/>
						<label htmlFor="start_date">Start Date</label>
						<input
							type="date"
							id="start_date"
							ref={startField}
							required={true}
							onChange={() => {
								if(!startField?.current) return;
								setStart(startField.current.value)
							}}
							max={endDate}
							defaultValue={format(new Date(event.start), 'yyyy-MM-dd')}
						/>
						<label htmlFor="end_date">End Date</label>
						<input
							type="date"
							id="end_date"
							ref={endField}
							onChange={() => {
								if(!endField?.current) return;
								setEnd(endField.current.value)
							}}
							min={startDate}
							defaultValue={event?.end && format(new Date(event.end), 'yyyy-MM-dd')}
						/>
						<footer>
							<button type="button" onClick={() => setOpen(false)}>
								Cancel
							</button>
							<button type="submit">Save Changes</button>
						</footer>
					</form>
				</div>
			)}
		</>
	)
}


export default EditEvent