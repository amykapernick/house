import { RecipeContent } from "@ts/meals"
import formatTime from "@utils/meals/formatTime"
import LevelIcon from '@img/icons/level.svg'
import TimeIcon from '@img/icons/time.svg'
import FallbackImage from '@img/icons/fish.svg?url'
import styles from './styles.module.css'

type RecipeCardProps = RecipeContent & {

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
					<img
						src={FallbackImage}
						alt=''
						className={`${styles.image} ${styles.fallback}`}
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