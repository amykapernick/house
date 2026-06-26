import { C as derived, T as writable } from "./server.js";
import "./index-server2.js";
//#region src/lib/auth.ts
var clerk = writable(null);
var isAuthenticated = derived(clerk, ($clerk) => !!$clerk?.session);
derived(clerk, ($clerk) => $clerk?.user ?? null);
async function initClerk(publishableKey) {
	const { Clerk } = await import("@clerk/clerk-js");
	const clerkInstance = new Clerk(publishableKey);
	await clerkInstance.load();
	clerk.set(clerkInstance);
	clerkInstance.addListener(() => {
		clerk.set(clerkInstance);
	});
	return clerkInstance;
}
//#endregion
export { isAuthenticated as n, initClerk as t };
