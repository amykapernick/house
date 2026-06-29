import type { Resource } from './resources'
import type { Project, Task } from './tasks'
import type { Area, Info, Item } from './house'
import type { Guest } from './stats'
import type { Calendar } from './calendar'
import type { User } from './global'

export type Query = {
	guests?: Guest[]
	areas?: Area[]
	calendars?: Calendar[]
	info?: Info[]
	items?: Item[]
	projects?: Project[]
	resources?: Resource[]
	tasks?: Task[]
	users?: User[]
}
