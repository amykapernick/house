import { RecipeContent } from "@ts/meals"
import formatTime from "@utils/meals/formatTime"
import LevelIcon from '@img/icons/level.svg'
import TimeIcon from '@img/icons/time.svg'
import FallbackImage from '@img/icons/fish.svg'
import styles from './styles.module.css'

type RecipeCardProps = RecipeContent & {

}

const RecipeCard = (props: RecipeCardProps) => {
	const {data, slug} = props
	const {image, time, title, difficulty} = data
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
		</div>

	)
}

export default RecipeCard