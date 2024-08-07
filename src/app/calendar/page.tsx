import { Metadata } from 'next';
import CalendarView from '@components/partials/Calendar';

export const metadata: Metadata = {
    title: 'Calendar',
    description: 'View combined calendars and tasks for the family',
};

export default function CalendarPage() {
    
    return (
        <>
            <h1>Calendar</h1>
			<CalendarView />
        </>
    );
}