import styles from './styles.module.css'
import type { ReactNode } from 'react'

type LayoutProps = {
	children: ReactNode
	fullWidth?: boolean
}

const Layout = (props: LayoutProps) => {
	const { children, fullWidth } = props

	return (
		<div className={[styles.layout, fullWidth && styles.full].join(` `)}>
			{children}
		</div>
	)
}

export default Layout