import Calendar from '@components/parts/calendar/calendar';
import parseCalendars from '@utils/calendar/parseCalendarFeeds';
import parseTasks from '@utils/calendar/parseTasks';
import fetchData from '@utils/fetchData';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Calendar',
	description: 'View combined calendars and tasks for the family',
};

export default async function CalendarPage ()
{
	const { tasks = [], calendars = [] } = await fetchData({
		authenticated: true,
		gqlQuery: `
			query {
				tasks {
					id
					name
					assigned {
						name
						id
						profile
					}
					status
					due
				}
				calendars {
					name
					url
					colour
				}
			}
		`
	});

	const taskEvents = parseTasks(tasks);
	// const calendarEvents = parseCalendars(calendars) ?? [];

	const events = [
		...taskEvents, 
		// ...calendarEvents
	];

	return ( 
		<>
			<h1>Calendar</h1>
			<Calendar events={events} />
		</>
	)
}