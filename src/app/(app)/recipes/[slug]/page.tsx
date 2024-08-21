import RecipeView from "@components/partials/Recipe"
import fetchData from "@utils/fetchData"
import type { Recipe as RecipeType } from "@ts/meals"

type RecipeProps = {
	params: {
		slug: string
	}
}

export async function generateStaticParams() {
	const { recipes = [] } = await fetchData({
		gqlQuery: `
			query {
				recipes {
					slug
				}
			}
		`
	})

	return recipes.map(({slug}) => ({
		slug
	}))
}

export default async function Recipe(props: RecipeProps) {
	const { slug } = props.params
	const { recipe } = await fetchData({
		gqlQuery: `
			query {
				recipe(slug: "${slug}") {
					name
					categories
					image
					id
					time
					slug
					difficulty
					ingredients {
						quantity
						unit
						ingredient
						full
						format
						category
					}
					method
				}
			}
		`
	}) as { recipe: RecipeType }
	

	return (
		<>
			<RecipeView {...recipe} />
		</>
	)
}