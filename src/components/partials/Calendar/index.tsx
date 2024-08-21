'use client'

import { useEffect, useState } from 'react';
import Calendar from '@components/parts/calendar/calendar';
import parseCalendars from '@utils/calendar/parseCalendarFeeds';
import parseTasks from '@utils/calendar/parseTasks';
import { fetchCalendarEvents } from 'src/app/actions';
import type { Task } from '@ts/tasks';
import type { Calendar as CalendarType, Event } from '@ts/calendar';

type CalendarViewProps = {
    tasks: Task[]
    calendars: CalendarType[]
}

const CalendarView = (props: CalendarViewProps) => {
	const { tasks = [], calendars = [] } = props
	const [events, setEvents] = useState<Event[]>([]);

	useEffect(() => {           
		let updatedEvents = events 
		const taskEvents = parseTasks(tasks);
        
		if(
			!updatedEvents.some((event) => (
				event.title === taskEvents?.[0].title ||
                event.title === taskEvents?.[1].title ||
                event.title === taskEvents?.[2].title
			))
		) {
			updatedEvents.push(...taskEvents);
		}

		setEvents(updatedEvents);

		fetchCalendarEvents(calendars)
			.then(calendarEvents => {
				if(
					!updatedEvents.some((event) => (
						event.title === calendarEvents?.[0].title ||
                        event.title === calendarEvents?.[1].title ||
                        event.title === calendarEvents?.[2].title
					))
				) {
					updatedEvents.push(...calendarEvents);
				}

				setEvents(updatedEvents);
			})

	}, []);

	return (
		<>
			<Calendar events={events} />
		</>
	);
}

export default CalendarView