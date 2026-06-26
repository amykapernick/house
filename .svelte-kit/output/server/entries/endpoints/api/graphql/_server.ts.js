import { t as private_env } from "../../../../chunks/shared-server.js";
import { json } from "@sveltejs/kit";
//#region src/routes/api/graphql/+server.ts
var POST = async ({ request }) => {
	const { query } = await request.json();
	const token = request.headers.get("Authorization");
	const headers = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = token;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 3e4);
	try {
		const response = await fetch(`${private_env.API_URL}/graphql`, {
			method: "POST",
			headers,
			body: JSON.stringify({ query }),
			signal: controller.signal
		});
		clearTimeout(timeout);
		return json(await response.json());
	} catch (err) {
		clearTimeout(timeout);
		console.error("[api/graphql] proxy error:", err);
		return json({
			errors: [{ message: "API request failed or timed out" }],
			data: {}
		});
	}
};
//#endregion
export { POST };
