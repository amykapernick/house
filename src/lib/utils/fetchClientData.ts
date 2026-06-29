import { getToken } from '$lib/auth';

type FetchClientDataProps = {
	gqlQuery: string
}

const fetchClientData = async (props: FetchClientDataProps) => {
	const { gqlQuery } = props;
	const token = await getToken();

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	return await fetch('/api/graphql', {
		method: 'POST',
		headers,
		body: JSON.stringify({ query: gqlQuery }),
	})
		.then((res) => res.json())
		.then((res) => {
			if (res?.errors) {
				console.log({ ...res });
				return {};
			}
			return res?.data || {};
		})
		.catch((err) => {
			console.error(err);
			return {};
		});
};

export default fetchClientData;
