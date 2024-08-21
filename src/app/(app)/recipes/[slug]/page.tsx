import RecipeView from "@components/partials/Recipe"
import fetchData from "@utils/fetchData"

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

	console.log({recipes})

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
	})
	

	return (
		<>
			<RecipeView {...recipe} />
		</>
	)
}