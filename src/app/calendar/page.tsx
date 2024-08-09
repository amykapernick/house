import { Metadata } from 'next';
import CalendarView from '@components/partials/Calendar';
import fetchData from '@utils/fetchData';

export const metadata: Metadata = {
    title: 'Calendar',
    description: 'View combined calendars and tasks for the family',
};

const CalendarPage = async () => {
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
    
    return (
        <>
            <h1>Calendar</h1>
			<CalendarView tasks={tasks} calendars={calendars} />
        </>
    );
}

export default CalendarPage