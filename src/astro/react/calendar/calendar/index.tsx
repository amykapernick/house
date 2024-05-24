import { useEffect, useState } from 'react';
import AddEvent from '@react/calendar/addEvent';
import Event from '@react/calendar/event'
import type { EventType } from '@react/calendar/event';
import Dates from '@react/calendar/dates';
import { addWeeks, format, startOfWeek } from 'date-fns';
import {
	Scheduler,
	WeekView,
	Appointments,
  } from '@devexpress/dx-react-scheduler-material-ui';
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

	return (
		<>
			<Scheduler>
				<WeekView
					startDayHour={8}
					endDayHour={20}
					cellDuration={60}
					name="week"
					excludedDays={[0, 6]}
				/>
				<Appointments />
			</Scheduler>
		</>
	);
}

export default Calendar;
