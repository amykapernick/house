

import { MenuItem } from '@ts/global';
import styles from './styles.module.css'
import { SignInButton, SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

// TODO Fix menu sections
const menuItems: MenuItem[] = [
	{
	  label: 'Home',
	  link: '/',
	},
	{
	  label: 'Meals',
	  items: [
		  {
			  label: 'Recipes',
			  link: '/recipes',
		  },
		  {
			  label: 'Meal Planner',
			  link: '/meals/planning',
			  auth: true
		  },
		  {
			  label: 'Shopping List',
			  link: '/meals/list',
			  auth: true
		  }
	  ]
	},
	{
	  label: 'To Do',
	  link: '/tasks',
	  auth: true
	},
	{
	  label: 'Calendar',
	  link: '/calendar',
	  auth: true
	}
  ]; 


  const Header = () => {
	const isAuthenticated = !!auth()?.sessionId

    return (
        <header className={styles.header}>
			<a href="/" className={styles.title}>🏡</a>
			<nav> 
				<ul className={styles.menu}>
					{menuItems.filter(({auth}) => !auth || isAuthenticated).map(({label, link, items}) => (
						<li>
							{items ? 
								<>
									<button className={styles.menu_section}>{label}</button>
									<ul className={styles.sub}>
										{
											items.filter(({auth}) => !auth || isAuthenticated).map(item => (
												<li>
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
						<SignedOut>
						<li>
							<SignInButton />
							</li>
						</SignedOut>
					
				</ul>
			</nav>
		</header>
    );
};

export default Header;