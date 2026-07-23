import { queueCompletion, getQueuedCompletions, removeQueuedCompletion } from './completionQueue';
import { getToken } from '$lib/auth';
import { getGraphqlUrl } from '$utils/fetchClientData';

export interface CompleteTaskResult {
	success: boolean
	// Set when the request couldn't reach the network at all (offline) rather than
	// the API rejecting it - the caller queued for retry instead of failing hard.
	queued?: boolean
}

const SYNC_TAG = `complete-task-sync`;

async function registerBackgroundSync(): Promise<void> {
	// Not supported in Safari/Firefox - feature-detected so those browsers just
	// keep today's plain-error behaviour with no queued retry (see completeTask()'s
	// catch block below, which still queues in IndexedDB either way - the sync
	// registration is just what wakes the SW to nudge a replay; the page-context
	// replay on 'online'/app-load in +layout.svelte works regardless of this).
	if (!(`serviceWorker` in navigator) || !(`SyncManager` in window)) return;

	const registration = await navigator.serviceWorker.ready;
	await (registration as any).sync.register(SYNC_TAG).catch(() => {});
}

// The single chokepoint every task-completion call site should use, instead of
// each hand-rolling its own fetch (previously duplicated across Task.svelte,
// ScheduleView.svelte, Calendar.svelte, and ChoreItem.svelte). Consolidating here
// is what makes offline queueing possible at all - it can't live in four separate
// copies.
export async function completeTask(taskId: string, platform: string): Promise<CompleteTaskResult> {
	const token = await getToken();
	let response: Response;

	try {
		response = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { completeTask(taskId: "${taskId}", platform: ${platform}) { success } }`,
			}),
		});
	}
	catch {
		// fetch() itself threw - a genuine network failure (offline), not the API
		// rejecting the request. Queue for retry rather than surfacing a hard error.
		await queueCompletion({ taskId, platform });
		await registerBackgroundSync();
		return { success: false, queued: true };
	}

	const json = await response.json();
	return { success: !!json?.data?.completeTask?.success };
}

export async function replayQueuedCompletions(): Promise<void> {
	const pending = await getQueuedCompletions();

	for (const { taskId, platform } of pending) {
		const result = await completeTask(taskId, platform);
		if (result.success) await removeQueuedCompletion(taskId);
	}
}
