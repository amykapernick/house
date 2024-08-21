import RecipeFeed from '@components/parts/meals/RecipeFeed';
import fetchData from '@utils/fetchData';
import type { Recipe } from '@ts/meals';

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
	}) as { recipes: Recipe[] }
	
	return (
		<>
			<h1>Recipes</h1>
			<RecipeFeed recipes={recipes} />
		</>
	)
}