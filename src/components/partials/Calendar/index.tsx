'use client'

import { useEffect, useState } from 'react';
import Calendar from '@components/parts/calendar/calendar';
import parseTasks from '@utils/calendar/parseTasks';
import parseEvents from '@utils/calendar/parseEvents'
import { fetchCalendarEvents } from 'src/app/actions';
import type { Task } from '@ts/tasks';
import type { Calendar as CalendarType, Event } from '@ts/calendar';

type CalendarViewProps = {
    tasks: Task[]
    calendars: CalendarType[]
	allDayEvents: Event[]
}

const CalendarView = (props: CalendarViewProps) => {
	const { tasks = [], calendars = [], allDayEvents = [] } = props
	const [events, setEvents] = useState<Event[]>([]);
	const [backgroundEvents, setBackgroundEvents] = useState<Event[]>([]);

	console.log({allDayEvents})

	useEffect(() => {         
		let updatedEvents = events 
		const taskEvents = parseTasks(tasks);
		const backEvents = parseEvents(allDayEvents);

		console.log({allDayEvents, backEvents})
        
		if(
			!updatedEvents.some((event) => (
				event.title === taskEvents?.[0].title ||
	            event.title === taskEvents?.[1].title ||
	            event.title === taskEvents?.[2].title
			))
		) {
			updatedEvents.push(...taskEvents);
		}

		setEvents([...updatedEvents, ...backEvents]);

		// fetchCalendarEvents(calendars)
		// 	.then(calendarEvents => {
		// 		if(
		// 			!updatedEvents.some((event) => (
		// 				event.title === calendarEvents?.[0].title ||
		//                 event.title === calendarEvents?.[1].title ||
		//                 event.title === calendarEvents?.[2].title
		// 			))
		// 		) {
		// 			updatedEvents.push(...calendarEvents);
		// 		}

		// 		setEvents(updatedEvents);
		// 	})

	}, []);

	return (
		<>
			<Calendar events={events} />
		</>
	);
}

export default CalendarView