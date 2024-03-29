import { useEffect, useState } from 'react';
import AddEvent from '@react/calendar/addEvent';
import Event from '@react/calendar/event'
import type { EventType } from '@react/calendar/event';
import Dates from '@react/calendar/dates';
import { addWeeks, format, startOfWeek } from 'date-fns';

import styles from './styles.module.css'


const Calendar = () => {
	const [events, setEvents] = useState<EventType[]>([]);
	const weeks = 6
	const [startWeek, setStartWeek] = useState<string>(format(startOfWeek(new Date(), {weekStartsOn: 1}), 'yyyy-MM-dd'))
	const [endDate, setEndDate] = useState<string>(format(addWeeks(new Date(startWeek), weeks), 'yyyy-MM-dd'))
	const updateEvents = (newEvents: EventType[]) => {
		setEvents(newEvents);
		localStorage.setItem('events', JSON.stringify(newEvents));
	}
	const handleChangeWeek = (newStartWeek: Date) => {
		const newDate = format(newStartWeek, 'yyyy-MM-dd')
		setStartWeek(newDate);
		localStorage.setItem('calendar_start', newDate);
	}
	
	useEffect(() => {
		const localEvents = localStorage.getItem('events');
		const savedStartDate = localStorage.getItem('calendar_start')

		if (localEvents) {
			setEvents(JSON.parse(localEvents));
		}

		if(savedStartDate) {
			setStartWeek(savedStartDate);
		}
	}, [])

	return (
		<>
			<div className={styles.controls}>
				<p>View starting <span className={styles.start_date}>{format(new Date(startWeek), 'dd MMM')}</span></p>
				<button
					onClick={() => {
						handleChangeWeek(addWeeks(new Date(startWeek), -1))
					}}
				>
					Previous Week
				</button>
				
				<button
					onClick={() => {
						handleChangeWeek(addWeeks(new Date(startWeek), 1))
					}}
				>
					Next Week
				</button>
				<button
					onClick={() => {
						handleChangeWeek(startOfWeek(new Date(), {weekStartsOn: 1}))
					}}
				>
					Current Week
				</button>
				<AddEvent {...{events, updateEvents}} />
			</div>
			<div className={styles.calendar}>
				<Dates 
					startWeek={startWeek} 
					className={styles.date} 
					weeksShown={weeks}
				/>
				{events.map((event) => (
					<Event
						className={styles.event}
						key={event.id}
						{...event}
						updateEvents={updateEvents}
						events={events}
						startWeek={startWeek}
						weeksShown={weeks}
					/>	
				))}
				
			</div>
		</>
	);
}

export default Calendar;
