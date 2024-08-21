import Resources from '@components/partials/Resources';
import fetchData from '@utils/fetchData';
import type { Resource } from '@ts/resources';

export default async function Home () {
	const { resources = [] } = await fetchData({
		authenticated: true,
		gqlQuery: `
			query {
				resources {
					name
					id
					category
					description
					image 
					login
					url
					icon
				}
			}
		`
	}) as { resources: Resource[] }
	
	return (
		<>
			<h1>Reference</h1>
			<Resources resources={resources} />
		</>
	)
}