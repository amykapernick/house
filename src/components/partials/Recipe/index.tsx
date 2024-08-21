import Time from '@img/icons/time.svg'
import Difficulty from '@img/icons/level.svg'
import formatTime from '@utils/meals/formatTime'
import styles from './styles.module.css'
import type { Recipe } from "@ts/meals"

type RecipeProps = Recipe & {

}

const RecipeView = (props: RecipeProps) => {
	const { name, categories, image, time, difficulty, ingredients, method } = props

	return (
		<article className={styles.recipe}>
			<header className={styles.header}>
				<h1>{name}</h1>
				{categories && (
					<ul className={styles.categories}>
						{categories.map((category, i) => (
							<li key={i}>{category}</li>
						))}
					</ul>
				)}
				{time && <span className={styles.info}><Time /> {formatTime(time)}</span>}
				{difficulty && <span className={styles.info}><Difficulty /> {difficulty}</span>}
				
			</header>
			{image && (
				<img className={styles.image} src={image} alt={`Photo of ${name}`} />
			)}
			{ingredients && <section>
				<h2>Ingredients</h2>
			</section>}
			{method && <section>
				<h2>Method</h2>
				<div dangerouslySetInnerHTML={{__html: method}} />
			</section>}
		</article>
	)
}

export default RecipeView