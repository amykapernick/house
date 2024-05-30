import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import type { EventType as Event } from "@react/calendar/event";
import styles from './styles.module.css'

type AddEventProps = {
	events: Event[];
	updateEvents: (events: Event[]) => void;
}

const AddEvent = (props: AddEventProps) => {
	const { events, updateEvents } = props
	const nameField = useRef<HTMLInputElement>(null)
	const startField = useRef<HTMLInputElement>(null)
	const endField = useRef<HTMLInputElement>(null)
	const [open, setOpen] = useState(false);
	const [startDate, setStart] = useState<string | undefined>(undefined)
	const [endDate, setEnd] = useState<string | undefined>(undefined)
	const handleAddEvent = (e: SyntheticEvent) => {
		e.preventDefault();

		if(!nameField?.current) return;
		if(!startField?.current) return;

		const newEvent: Event = {
			name: nameField.current?.value,
			id: generateId(),
			start: new Date(startField.current.value),
		}

		if(
			endField?.current?.value && 
			endField.current.value !== startField.current.value
		) {
			newEvent.end = new Date(endField.current.value);
		}
	
		updateEvents([...events, newEvent]);
		setOpen(false);
	  };

	return (
		<>
			<button onClick={() => setOpen(true)}>Add new event</button>
			{open && (
				<div className={styles.popup}>
					<h3 className={styles.heading}>Add New Event</h3>
					<form className={styles.form} onSubmit={handleAddEvent}>
						<label htmlFor="add_event">Event Name</label>
						<input
							type="text" 
							id="add_event" 
							ref={nameField}
							required={true}
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
						/>
						<footer>
							<button type="button" onClick={() => setOpen(false)}>
								Cancel
							</button>
							<button type="submit">Add</button>
						</footer>
					</form>
				</div>
			)}
	  </>
	)
}

// generate a unique id string
const generateId = () =>  Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);


export default AddEvent