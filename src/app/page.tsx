import RecipeFeed from '@components/parts/meals/RecipeFeed';
import fetchData from '@utils/fetchData';

export default async function Home ()
{
	const { meals = [] } = await fetchData({
		authenticated: true,
		gqlQuery: `
			query {
				meals {
					name
					categories
					image
					time
					slug
					difficulty
				}
			}
		`
	});
	
	return (
		<>
			<h2>Recipes</h2>
			<RecipeFeed recipes={meals} />
		</>
	)
}