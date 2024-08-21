import type { Project, Task } from '@ts/tasks';
import type { Recipe } from "@ts/meals"
import type { Area, Info, Item } from '@ts/house';
import type { Guest } from '@ts/stats';
import type { Calendar,Resource } from '@ts/calendar';
import type { User } from "@ts/global";

export type Query = {
	guests?: Guest[]
	areas?: Area[]
	calendars?: Calendar[]
	info?: Info[]
	items?: Item[]
	projects?: Project[]
	recipes?: Recipe[]
	recipe?: Recipe
	resources?: Resource
	tasks?: Task[]
	users?: User[]
}