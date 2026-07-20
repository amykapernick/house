import type { MenuItem } from '$types/global';
import { resolve } from '$app/paths';
import Dashboard from '$img/icons/board-2-1.svg?component';
import References from '$img/icons/saved-items-2.svg?component';
import Tasks from '$img/icons/check-list-1.svg?component';
import Habits from '$img/icons/questionnaire-2.svg?component';
import Chores from '$img/icons/clear-data-1.svg?component';
import Calendar from '$img/icons/calendar-date.svg?component';
import MealPlan from '$img/icons/diet-plan-1.svg?component';
import ShopList from '$img/icons/receipt-list-42-2.svg?component';
import Recipes from '$img/icons/recipe-book-47-1.svg?component';
import SmallHuman from '$img/icons/baby-1.svg?component';
import Schedule from '$img/icons/gantt-1.svg'
import Budget from '$img/icons/analytics-1.svg'
import Health from '$img/icons/phone-heartbeat-1.svg'
import Graphql from '$img/icons/graphql.svg?component'
import DashboardIcon from '$img/icons/layout-11-1.svg'
import DashboardColour from '$img/icons/board-2-2.svg?component';
import ReferencesColour from '$img/icons/saved-items-3.svg?component';
import TasksColour from '$img/icons/check-list-2.svg?component';
import HabitsColour from '$img/icons/questionnaire-3.svg?component';
import ChoresColour from '$img/icons/clear-data-2.svg?component';
import CalendarColour from '$img/icons/calendar-date-2.svg?component';
import MealPlanColour from '$img/icons/diet-plan-2.svg?component';
import ShopListColour from '$img/icons/receipt-list-42-3.svg?component';
import RecipesColour from '$img/icons/recipe-book-47-2.svg?component';
import SmallHumanColour from '$img/icons/baby-3.svg?component';
import ScheduleColour from '$img/icons/gantt-2.svg'
import BudgetColour from '$img/icons/analytics-2.svg'
import HealthColour from '$img/icons/phone-heartbeat-2.svg'
import DashboardIconColour from '$img/icons/layout-11-3.svg'

export const menuItems: MenuItem[] = [
	{
		label: `Home`,
		link: resolve(`/`),
		Icon: DashboardColour
	},
	{
		label: `To Do`,
		link: resolve(`/tasks`),
		auth: true,
		Icon: TasksColour
	},
	{
		label: `Habits`,
		link: resolve(`/habits`),
		auth: true,
		Icon: HabitsColour
	},
	{
		label: `Chores`,
		link: resolve(`/chores`),
		auth: true,
		Icon: ChoresColour
	},
	{
		label: `Calendar`,
		link: resolve(`/calendar`),
		auth: true,
		Icon: CalendarColour
	},
	{
		label: `Schedule`,
		link: resolve(`/schedule`),
		auth: true,
		Icon: ScheduleColour
	},
	{
		label: `Budget`,
		link: resolve(`/budget`),
		auth: true,
		Icon: BudgetColour
	},
	{
		label: `Recipes`,
		link: resolve(`/recipes`),
		Icon: RecipesColour
	},
	{
		label: `Meal Plan`,
		link: resolve(`/meal-plan`),
		auth: true,
		Icon: MealPlanColour
	},
	{
		label: `Shopping List`,
		link: resolve(`/shopping-list`),
		auth: true,
		Icon: ShopListColour
	},
	{
		label: `Reference`,
		link: resolve(`/reference`),
		auth: true,
		Icon: ReferencesColour
	},
	{
		label: `Small Human`,
		link: resolve(`/small-human`),
		auth: true,
		Icon: SmallHumanColour
	},
	{
		label: `Health`,
		link: resolve(`/health`),
		auth: true,
		Icon: HealthColour
	},
	{
		label: `Dashboard`,
		link: resolve(`/dashboard`),
		auth: true,
		Icon: DashboardIconColour
	},
	...(import.meta.env.DEV ? [{
		label: `GraphQL`,
		link: resolve(`/dev/graphql`),
		Icon: Graphql
	}] : []),
];

// Account-level pages (e.g. profile) live in the header's account area rather
// than the main menuItems grid, but still need to be recognised by routeRequiresAuth.
// TODO: fix profile menu
export const authOnlyRoutes: string[] = [
	resolve(`/profile`),
	resolve(`/content`),
	resolve(`/design/colours`),
];

export function routeRequiresAuth(pathname: string): boolean {
	const authRoutes = [...menuItems.filter((item) => item.auth && item.link).map((item) => item.link), ...authOnlyRoutes];
	return authRoutes.some((link) => link && (pathname === link || pathname.startsWith(`${link}/`)));
}
