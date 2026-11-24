import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	// Forward variables and operationName as well as the query - mutations that pass user input
	// as GraphQL variables (gifts, createTask) fail validation without them.
	const { query, variables, operationName } = await request.json();
	const token = request.headers.get(`Authorization`);

	const headers: Record<string, string> = {
		'Content-Type': `application/json`,
	};

	if (token) {
		headers[`Authorization`] = token;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 60000);

	try {
		const response = await fetch(`${env.API_URL}/graphql`, {
			method: `POST`,
			headers,
			body: JSON.stringify({ query, variables, operationName }),
			signal: controller.signal,
		});

		clearTimeout(timeout);
		const data = await response.json();
		return json(data);
	}
	catch (err) {
		clearTimeout(timeout);
		console.error(`[api/graphql] proxy error:`, err);
		return json({ errors: [{ message: `API request failed or timed out` }], data: {} });
	}
};
