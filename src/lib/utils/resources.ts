import type { Resource } from '$types/resources';
import { getToken } from '$lib/auth';
import { clearCache, getGraphqlUrl } from '$utils/fetchClientData';

// Resources are memos in household_api's Memos "Resources" space. The API writes the memo in
// its fixed format (see household_api's src/utils/memos/parseResources.ts), so the app only
// sends the fields.

export const RESOURCES_CACHE_KEY = `resources`;

export const RESOURCE_FIELDS = `id name category description image login url localUrl icon archived`;

export type ResourceIconUpload = { filename: string; type: string; content: string };

export type ResourceInput = {
	name?: string;
	category?: string | null;
	description?: string | null;
	url?: string | null;
	login?: string | null;
	localUrl?: string | null;
	icon?: string | null;
	iconUpload?: ResourceIconUpload;
	archived?: boolean;
};

export type ResourceMutationResult = { ok: true; resource: Resource | null } | { ok: false; message: string };

// Uploaded icons are capped at 256 KB by the API.
export const MAX_ICON_BYTES = 256 * 1024;

async function resourceMutation(query: string, name: string, variables: Record<string, unknown>): Promise<ResourceMutationResult> {
	const token = await getToken();

	try {
		const json = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query, variables }),
		}).then((r) => r.json());

		const error = json?.errors?.[0];
		if (error) {
			// Validation messages from the API are written for people; anything else isn't.
			return { ok: false, message: error.extensions?.code === `BAD_USER_INPUT` ? error.message : `Couldn't save. Try again.` };
		}
		if (json?.data?.[name] == null) return { ok: false, message: `Couldn't save. Try again.` };

		clearCache(RESOURCES_CACHE_KEY);
		return { ok: true, resource: typeof json.data[name] === `object` ? json.data[name] : null };
	}
	catch {
		return { ok: false, message: `Couldn't reach the server. Try again.` };
	}
}

export const createResource = (input: ResourceInput) =>
	resourceMutation(
		`mutation($input: ResourceInput!) { createResource(input: $input) { ${RESOURCE_FIELDS} } }`,
		`createResource`,
		{ input }
	);

export const updateResource = (id: string, input: ResourceInput) =>
	resourceMutation(
		`mutation($id: ID!, $input: ResourceInput!) { updateResource(id: $id, input: $input) { ${RESOURCE_FIELDS} } }`,
		`updateResource`,
		{ id, input }
	);

export const deleteResource = (id: string) =>
	resourceMutation(`mutation($id: ID!) { deleteResource(id: $id) }`, `deleteResource`, { id });

// Reads an image file as base64 for ResourceInput.iconUpload.
export function readIconFile(file: File): Promise<ResourceIconUpload> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = String(reader.result ?? ``);
			resolve({ filename: file.name, type: file.type, content: result.slice(result.indexOf(`,`) + 1) });
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
