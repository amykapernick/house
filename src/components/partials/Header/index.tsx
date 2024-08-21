import MainMenu from '@components/parts/MainMenu';
import { SignInButton, SignedOut } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import styles from './styles.module.css'
import type { MenuItem } from '@ts/global';

// TODO Fix menu sections
const menuItems: MenuItem[] = [
	{
		label: `Home`,
		link: `/`,
	},
	{
		label: `Meals`,
		items: [
			{
				label: `Recipes`,
				link: `/recipes`,
			},
			{
				label: `Meal Planner`,
				link: `/meals/planning`,
				auth: true
			},
			{
				label: `Shopping List`,
				link: `/meals/list`,
				auth: true
			}
		]
	},
	{
		label: `To Do`,
		link: `/tasks`,
		auth: true
	},
	{
		label: `Calendar`,
		link: `/calendar`,
		auth: true
	},
	{
		label: `Reference`,
		link: `/reference`,
		auth: true
	}
]; 


const Header = () => {
	const isAuthenticated = !!auth()?.sessionId

	return (
		<header className={styles.header}>
			<a href="/" className={styles.title}>🏡</a>
			<MainMenu
				menuItems={menuItems}
				isAuthenticated={isAuthenticated}
			>
				<SignedOut>
					<li>
						<SignInButton />
					</li>
				</SignedOut>
			</MainMenu>
		</header>
	);
};

export default Header;