import { auth } from '@clerk/nextjs/server';

type fetchDataProps = {
	gqlQuery: string
	authenticated: boolean
}

const fetchData = async (props: fetchDataProps) => {
	const { gqlQuery, authenticated } = props
	const options: RequestInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: gqlQuery
		})
	}

	if(authenticated) {
		const { getToken } = auth();
		const token = await getToken();
	
		options.headers = {
			...options.headers,
			Authorization: `Bearer ${token}`
		}
	}

	

	return await fetch(`${process.env.API_URL}/graphql`, options).then(res => res.json())
	.then((res) => {
		if(res?.errors) {
			console.log({...res})
			console.error({...res?.errors})
			return {}
		}
		return res?.data || {}
	})
	.catch((err) => {
		console.error(err)
		return {}
	})

}

export default fetchData