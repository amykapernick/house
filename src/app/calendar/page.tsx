import { SignedIn, SignedOut } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import Calendar from '@components/parts/calendar/calendar';
import { Event } from '@ts/calendar';

export default async function CalendarPage ()
{
	

	return (
		<>
			<h1>Calendar</h1>
			<Calendar />
		</>
	)
}