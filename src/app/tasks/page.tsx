import TaskList from '@components/parts/tasks/TaskView';
import fetchData from '@utils/fetchData';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Tasks',
	description: 'View all upcoming and overdue tasks in various views',
};

export default async function CalendarPage ()
{
	const { tasks = [] } = await fetchData({
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
			}
		`
	});

	return ( 
		<>
			<h1>Tasks</h1>
			<TaskList tasks={tasks} />
		</>
	)
}