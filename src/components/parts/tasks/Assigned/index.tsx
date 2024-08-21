import styles from './styles.module.css'
import type { User } from "@ts/global"

type AssignedProps = {
	assignees: User[]
	className?: string
}

const Assignees = (props: AssignedProps) => {
	const { assignees = [], className = `` } = props
	return (
		<ul
			className={`${className} ${styles.list}`}
		>
			{assignees.map(({ slug, name, profile }) => (
				<li key={slug} className={styles.item}>
					<span className="sr-only">{name}</span>
					{profile ?
						<img className={styles.image} src={profile} alt="" />
						:	<span className={styles.image}>
							{name.split(` `).map(word => word[0]).join(``)}
						</span>
					}
				</li>
			))}
		</ul>
	)
}

export default Assignees