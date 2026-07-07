import type { Query } from '$types/graphql';
import { env } from '$env/dynamic/private';

type FetchDataProps = {
	gqlQuery: string
	token?: string | null
}

const fetchData = async (props: FetchDataProps): Promise<Query> => {
	const { gqlQuery, token } = props;
	const headers: Record<string, string> = {
		'Content-Type': `application/json`,
	};

	if (token) {
		headers[`Authorization`] = `Bearer ${token}`;
	}

	const options: RequestInit = {
		method: `POST`,
		headers,
		body: JSON.stringify({
			query: gqlQuery,
		}),
	};

	return await fetch(`${env.API_URL}/graphql`, options)
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

export default fetchData;
