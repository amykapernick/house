'use client'

import { useState } from 'react';
import styles from './styles.module.css'
import type { ReactNode} from 'react';
import type { MenuItem } from '@ts/global';

type MainMenuProps = {
	menuItems: MenuItem[]
	isAuthenticated: boolean
	children: ReactNode
}

const MainMenu = (props: MainMenuProps) => {
	const { menuItems, isAuthenticated, children } = props
	const [subMenu, setSubMenu] = useState<(string | false)>(false)

	return (
		<nav> 
			<ul className={styles.menu}>
				{menuItems.filter(({auth}) => !auth || isAuthenticated).map(({label, link, items}) => (
					<li key={label}>
						{items ? 
							<>
								<button 
									onClick={() => setSubMenu(subMenu === label ? false : label)}
									aria-pressed={subMenu === label}
									data-active={subMenu === label}
									className={styles.menu_section}
								>
									{label}
								</button>
								<ul
									className={styles.sub}
									data-open={subMenu === label}
								>
									{
										items.filter(({auth}) => !auth || isAuthenticated).map(item => (
											<li key={item.label}>
												<a href={item.link}>{item.label}</a>
											</li>
										))
									}
								</ul>
							</> : 
							<a href={link}>{label}</a>
						}	
					</li>
				))}
				{children}
			</ul>
		</nav>
	)
}

export default MainMenu