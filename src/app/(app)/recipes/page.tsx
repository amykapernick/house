import RecipeFeed from '@components/parts/meals/RecipeFeed';
import fetchData from '@utils/fetchData';

export default async function Recipes () {
	const { recipes = [] } = await fetchData({
		gqlQuery: `
			query {
				recipes {
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

	console.log({recipes})
	
	return (
		<>
			<h1>Recipes</h1>
			<RecipeFeed recipes={recipes} />
		</>
	)
}