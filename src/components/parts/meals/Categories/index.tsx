import { Category } from "@ts/meals"
import styles from './styles.module.css'

type CategoriesProps = {
	categories: Category[],
	current?: string
}

const Categories = (props: CategoriesProps) => {
	const {categories, current} = props
	return (
		<ul className={styles.categories}>
	{current && <li className={styles.category}><a href="/recipes">All</a></li>}
	{categories.map(({label, slug}) => (
		<li className={styles.category}>
			<a 
				href={`/recipes/category/${slug}`}
				data-current={slug === current ? 'true' : 'false'}
			>
				{label}
			</a>
		</li>
	))}
</ul>
	)
}

export default Categories