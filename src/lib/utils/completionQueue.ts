// Tiny hand-rolled IndexedDB wrapper - no dependency added for what's a single
// object store. IndexedDB (not localStorage) is what a service worker's `sync`
// handler and a page context can both read/write, which is why this exists at all
// rather than just another fetchClientData-style localStorage key - see
// completeTask.ts and +layout.svelte for how the queue actually gets drained.
const DB_NAME = `household-sync`;
const STORE_NAME = `pending-completions`;
const DB_VERSION = 1;

export interface QueuedCompletion {
	taskId: string
	platform: string
}

function openQueueDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			if (!request.result.objectStoreNames.contains(STORE_NAME)) {
				request.result.createObjectStore(STORE_NAME, { keyPath: `taskId` });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// Each operation opens, runs one transaction, and closes - rather than holding a
// connection open - so a stale connection never blocks a later deleteDatabase (e.g.
// in tests) or a version-change from another tab.
async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await openQueueDb();

	try {
		return await new Promise<T>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, mode);
			const request = run(tx.objectStore(STORE_NAME));
			tx.oncomplete = () => resolve(request.result);
			tx.onerror = () => reject(tx.error);
		});
	}
	finally {
		db.close();
	}
}

export const queueCompletion = (entry: QueuedCompletion): Promise<void> =>
	withStore(`readwrite`, (store) => store.put(entry)).then(() => undefined);

export const getQueuedCompletions = (): Promise<QueuedCompletion[]> =>
	withStore<QueuedCompletion[]>(`readonly`, (store) => store.getAll() as IDBRequest<QueuedCompletion[]>);

export const removeQueuedCompletion = (taskId: string): Promise<void> =>
	withStore(`readwrite`, (store) => store.delete(taskId)).then(() => undefined);
