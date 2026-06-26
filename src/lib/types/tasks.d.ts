import type { User, Platform } from './global'

export type TaskStatus = 'Not Started' | 'In Progress' | 'Ongoing' | 'Paused' | 'Done'

export type Task = {
	id: string,
	name: string,
	due: Date,
	status: TaskStatus,
	assigned: User[]
	subtasks: Task[],
	parent: string[],
	estimate: number,
	project: Project[],
	platform: Platform,
	link: string
}

export type ProjectStatus = 'Backlog' | 'Planning' | 'In progress' | 'Paused' | 'Done' | 'Cancelled' | 'Archived'

export type Project = {
	id: string,
	name: string,
	status: ProjectStatus,
	owner: User[],
	tasks: Task[],
	dates: {
		start: Date,
		end: Date
	}
}
