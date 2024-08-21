import formatTime from "@utils/meals/formatTime"
import LevelIcon from '@img/icons/level.svg'
import TimeIcon from '@img/icons/time.svg'
import FallbackImage from '@img/icons/fish.svg'
import styles from './styles.module.css'
import type { Recipe } from "@ts/meals"

type RecipeCardProps = Recipe & {

}

const RecipeCard = (props: RecipeCardProps) => {
	const {image, time, name, difficulty, slug} = props

	return (
		<div className={styles.card}>
			{
				image ? (
					<img
						className={styles.image}
						src={image}
						alt=""
						width={200}
						height={200}
					/>
				) : (
					<FallbackImage
						className={`${styles.image} ${styles.fallback}`}
						width={200}
						height={200}
					/>
				)
			}
			<h3 className={styles.title}>
				<a href={`/recipes/${slug}`}>{name}</a>
			</h3>
			{
				difficulty && (
					<span className={styles.details}>
						<LevelIcon />
						{difficulty}
					</span>
				)
			}
			{
				time && (
					<span className={styles.details}>
						<TimeIcon />
						{formatTime(time)}
					</span>
				)
			}
		</div>

	)
}

export default RecipeCard