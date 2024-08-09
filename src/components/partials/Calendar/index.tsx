'use client'

import { useEffect, useState } from 'react';
import Calendar from '@components/parts/calendar/calendar';
import parseCalendars from '@utils/calendar/parseCalendarFeeds';
import parseTasks from '@utils/calendar/parseTasks';
import type { Calendar as CalendarType, Event } from '@ts/calendar';
import { Task } from '@ts/tasks';
import { fetchCalendarEvents } from 'src/app/actions';

type CalendarViewProps = {
    tasks: Task[]
    calendars: CalendarType[]
}

const CalendarView = (props: CalendarViewProps) => {
    const { tasks = [], calendars = [] } = props
	const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {            
            const taskEvents = parseTasks(tasks);
            setEvents((prevEvents) => [...prevEvents, ...taskEvents]);

    }, [tasks]);

    useEffect(() => {            
        fetchCalendarEvents(calendars)
            .then(res => {
                console.log({res})
                setEvents((prevEvents) => [...prevEvents, ...res]);
            })

    }, [calendars]);

    return (
        <>
            <Calendar events={events} />
        </>
    );
}

export default CalendarView