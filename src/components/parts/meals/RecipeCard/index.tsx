import { RecipeContent } from "@ts/meals"
import formatTime from "@utils/meals/formatTime"
import SaveRecipe from "@parts/meals/SaveRecipe"
import LevelIcon from '@img/icons/level.svg'
import TimeIcon from '@img/icons/time.svg'
import FallbackImage from '@img/icons/fish.svg'
import styles from './styles.module.css'

const RecipeCard = (props: RecipeContent) => {
	const {data, slug} = props
	const {image, time, title, difficulty} = data
	return (
		<div className={styles.card}>
	{
		image ? (
			<img
				className={styles.image}
				src={image}
				alt={`Photo of ${title}`}
				width={200}
				height={200}
			/>
		) : (
			<img
				src={FallbackImage}
				alt=''
				className={`${styles.image} ${styles.fallback}`}
			/>
		)
	}
	<h3><a href={`/recipes/${slug}`}>{title}</a></h3>
	{
		difficulty && (
			<span>
				<LevelIcon />
				{difficulty}
			</span>
		)
	}
	{
		time && (
			<span>
				<TimeIcon />
				{formatTime(time)}
			</span>
		)
	}
	<SaveRecipe className={styles.save} recipe={slug} />
</div>

	)
}

export default RecipeCard