import { RecipeContent } from "@ts/meals"
import styles from './styles.module.css'
import RecipeCard from "@parts/meals/RecipeCard"

type RecipeFeedProps = {
	recipes: RecipeContent[]
}

const RecipeFeed = (props: RecipeFeedProps) => {
	const {recipes} = props
	return (
		<ul className={styles.cards}>
	{
		recipes.map((recipe) => (
			<li key={recipe.id}>
				<RecipeCard {...recipe} />
			</li>
		))
	}
</ul>
	)
}

export default RecipeFeed