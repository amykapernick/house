import { getToken } from '$lib/auth';
import { getGraphqlUrl } from '$utils/fetchClientData';

export interface CreateTaskResult {
	success: boolean
}

// Backs the List view's quick-add input. Server-side this only ever creates a
// Todoist task (see household_api's createTask resolver) - no Notion equivalent
// exists yet.
//
// Unlike completeTask/updateTaskStatus, `content` is free-text the user just
// typed rather than a value the app already controls (an id, a fixed status) -
// so this goes through a GraphQL variable instead of the sibling utils' inline
// string interpolation, to avoid a stray quote in the task name breaking (or
// injecting into) the query.
export async function createTask(content: string): Promise<CreateTaskResult> {
	const token = await getToken();

	const response = await fetch(getGraphqlUrl(), {
		method: `POST`,
		headers: {
			'Content-Type': `application/json`,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			query: `mutation($content: String!) { createTask(content: $content) { success } }`,
			variables: { content },
		}),
	});

	const json = await response.json();
	return { success: !!json?.data?.createTask?.success };
}
