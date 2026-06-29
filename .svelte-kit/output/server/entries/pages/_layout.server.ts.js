import { t as private_env } from "../../chunks/shared-server.js";
//#region src/routes/+layout.server.ts
var load = async () => {
	return { clerkPublishableKey: private_env.CLERK_PUBLISHABLE_KEY ?? "" };
};
//#endregion
export { load };
