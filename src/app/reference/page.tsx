import Resources from '@components/partials/Resources';
import fetchData from '@utils/fetchData';

export default async function Home ()
{
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
	});
	
	return (
		<>
			<h1>Reference</h1>
			<Resources resources={resources} />
		</>
	)
}