import styles from './styles.module.css'
import type { ReactNode } from 'react'

const Layout = (props: { children: ReactNode }) => {
	const { children } = props

	return (
		<div className={styles.layout}>
			{children}
		</div>
	)
}

export default Layout