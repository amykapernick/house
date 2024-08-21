import OnePass from '@img/icons/1password.svg'
import Link from '@img/icons/link.svg'
import styles from './style.module.css'
import type { Resource } from "@ts/resources";

const Resources = (props: {resources: Resource[]}) => {
	const resources: Record<string, Resource[]> = {}

	props.resources.forEach(resource => {
		const category = resource?.category ?? `Other`
		if(!resources[category]) {
			resources[category] = []
		}

		resources[category].push(resource)
	})

	return (
		<div className={styles.resources}>
			{Object.entries(resources).map(([category, resources]) => (
				<section key={category} className={styles.category}>
					<h2>{category}</h2>
					<ul className={styles.list}>
						{resources.map(({name, url, id, icon, login, image, description, archived}) => (
							<li key={id} className={styles.item} data-archived={archived}>
								<a
									className={styles.title}
									href={url}
									target={url?.startsWith(`http`) ? `_blank` : `_self`}
									rel="noreferrer"
								>
									{name}
									<Link />
								</a>
								{(icon && icon.startsWith(`http`)) && (
									<img className={styles.icon} src={icon} alt={name} />
								)}
								{description && (
									<p>{description}</p>
								)}
								{login && (
									<a href={login} target="_blank" rel="noreferrer" className={styles.login}>
										<OnePass />
										<span className="sr-only">Login details for {name} on 1Password (access required)</span>
									</a>
								)}
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	)
}

export default Resources