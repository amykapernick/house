//#region src/hooks.server.ts
var handle = async ({ event, resolve }) => {
	event.locals.auth = {
		userId: null,
		sessionId: null,
		token: null
	};
	return resolve(event);
};
//#endregion
export { handle };
