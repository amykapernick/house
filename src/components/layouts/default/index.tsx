import { ReactNode } from 'react'
import styles from './styles.module.css'

const Layout = (props: { children: ReactNode }) => {
	const { children } = props

	return (
		<div className={styles.layout}>
			{children}
		</div>
	)
}

export default Layout