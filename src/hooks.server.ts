import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = { userId: null, sessionId: null, token: null };
	return resolve(event);
};
