import { getToken } from '$lib/auth';
import { getGraphqlUrl } from '$utils/fetchClientData';

export interface UpdateTaskStatusResult {
	success: boolean
}

// Shared by the status <select> (Notion only) and Kanban's arrow/drag moves, so
// there's one place doing this fetch instead of duplicating it per call site.
export async function updateTaskStatus(taskId: string, status: string): Promise<UpdateTaskStatusResult> {
	const token = await getToken();

	const response = await fetch(getGraphqlUrl(), {
		method: `POST`,
		headers: {
			'Content-Type': `application/json`,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			query: `mutation { updateTaskStatus(taskId: "${taskId}", status: "${status}") { success } }`,
		}),
	});

	const json = await response.json();
	return { success: !!json?.data?.updateTaskStatus?.success };
}
