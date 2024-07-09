import { auth } from '@clerk/nextjs/server';

type fetchDataProps = {
	item: 'meals' | 'tasks'
	gqlQuery: string
}

const fetchData = async (props: fetchDataProps) => {
	const { item, gqlQuery } = props
	const { getToken } = auth();
	const token = await getToken();

	return await fetch(`${process.env.API_URL}/graphql`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		},
		body: JSON.stringify({
			query: gqlQuery
		})
	}).then(res => res.json())
	.then((res) => res?.data || {})
	.catch((err) => {
		console.error(err)
		return {}
	})

}

export default fetchData