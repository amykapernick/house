'use client'

import { useEffect, useState } from 'react';
import Calendar from '@components/parts/calendar/calendar';
import parseCalendars from '@utils/calendar/parseCalendarFeeds';
import parseTasks from '@utils/calendar/parseTasks';
import fetchData from '@utils/fetchData';
import type { Event } from '@ts/calendar';

const CalendarView = () => {
	const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        const fetchDataAndParseCalendars = async () => {
            const { tasks = [], calendars = [] } = await fetchData({
                authenticated: true,
                gqlQuery: `
                    query {
                        tasks {
                            id
                            name
                            assigned {
								name
                                slug
                                profile
                                colour
                            }
                            status
                            due
                            estimate
                            link
                            platform
                        }
                        calendars {
                            name
                            url
                            colour
                            slug
                        }
                    }
                `
            });

            const taskEvents = parseTasks(tasks);
            setEvents(taskEvents);

            // const calendarEvents = await parseCalendars(calendars);
            // setEvents((prevEvents) => [...prevEvents, ...calendarEvents]);
        };

        fetchDataAndParseCalendars();
    }, []);

    return (
        <>
            <Calendar events={events} />
        </>
    );
}

export default CalendarView