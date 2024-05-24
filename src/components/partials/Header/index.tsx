import { MenuItem } from '@ts/global';
import { useState } from 'react'
import styles from './styles.module.css'

// TODO divide menu items by auth/public
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
			  link: '/meals/planning'
		  },
		  {
			  label: 'Shopping List',
			  link: '/meals/list'
		  }
	  ]
	},
	{
	  label: 'To Do',
	  link: '/tasks'
	},
	{
	  label: 'Calendar',
	  link: '/calendar'
	}
  ]; 


  const Header = () => {
    return (
        <header>
	<a href="/" className={styles.title}>🏡</a>
	  <nav>
		<ul className={styles.menu}>
			{menuItems.map(({label, link, items}) => (
				<li>
					{items ? 
						<>
							<button className={styles.menu_section}>{label}</button>
							<ul className={styles.sub}>
								{
									items.map(item => (
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
			<li>
				{/* TODO: Add signin button back */}
				{/* <SignedIn>
					<UserButton  />
				</SignedIn>
				<SignedOut>
					<SignIn />
				</SignedOut> */}
			</li>
		</ul>
	</nav>
</header>
    );
};

export default Header;