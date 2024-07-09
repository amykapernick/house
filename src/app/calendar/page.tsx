import { SignedIn, SignedOut } from '@clerk/nextjs';

import Calendar from '@components/parts/calendar/calendar';
import { Event } from '@ts/calendar';
import parseTasks from '@utils/calendar/parseTasks';
import fetchData from '@utils/fetchData';

export default async function CalendarPage ()
{
	const { tasks = [] } = await fetchData({
		item: 'tasks',
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
			}
		`
	});

	const events = [...parseTasks(tasks)]

	return ( 
		<>
			<h1>Calendar</h1>
			<Calendar events={events} />
		</>
	)
}