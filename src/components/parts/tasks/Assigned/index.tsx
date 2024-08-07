import { User } from "@ts/tasks"
import styles from './styles.module.css'

type AssignedProps = {
	assignees: User[]
	className?: string
}

const Assignees = (props: AssignedProps) => {
	const { assignees = [], className = '' } = props
	return (
		<ul
			className={`${className} ${styles.list}`}
		>
			{assignees.map(({ id, name, profile }) => (
				<li key={id} className={styles.item}>
					<span className="sr-only">{name}</span>
					{profile ?
						<img className={styles.image} src={profile} alt="" />
						:	<span className={styles.image}>
							{name?.split(' ').map(word => word[0]).join('')}
						</span>
					}
				</li>
			))}
		</ul>
	)
}

export default Assignees