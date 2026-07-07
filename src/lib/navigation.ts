import type { MenuItem } from '$types/global';
import { resolve } from '$app/paths';
import Dashboard from '$img/icons/layout-11.svg?component';
import Archive from '$img/icons/archive-drawer.svg?component';
import List from '$img/icons/list.svg?component';
import Calendar from '$img/icons/calendar-date.svg?component';
import Plan from '$img/icons/diet-plan.svg?component';
import Cart from '$img/icons/cart.svg?component';
import Recipes from '$img/icons/recipe-book-47.svg?component';
import Baby from '$img/icons/baby.svg?component';

export const menuItems: MenuItem[] = [
	{
		label: `Home`,
		link: resolve(`/`),
		Icon: Dashboard
	},
	{
		label: `To Do`,
		link: resolve(`/tasks`),
		auth: true,
		Icon: List
	},
	{
		label: `Calendar`,
		link: resolve(`/calendar`),
		auth: true,
		Icon: Calendar
	},
	{
		label: `Recipes`,
		link: resolve(`/recipes`),
		Icon: Recipes
	},
	{
		label: `Meal Plan`,
		link: resolve(`/meal-plan`),
		auth: true,
		Icon: Plan
	},
	{
		label: `Shopping List`,
		link: resolve(`/shopping-list`),
		auth: true,
		Icon: Cart
	},
	{
		label: `Reference`,
		link: resolve(`/reference`),
		auth: true,
		Icon: Archive
	},
	{
		label: `Small Human`,
		link: resolve(`/small-human`),
		auth: true,
		Icon: Baby
	},
];

export function routeRequiresAuth(pathname: string): boolean {
	return menuItems.some(
		(item) => item.auth && item.link && (pathname === item.link || pathname.startsWith(`${item.link}/`))
	);
}
