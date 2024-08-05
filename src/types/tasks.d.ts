export type TaskStatus = 'Not Started' | 'In Progress' | 'Ongoing' | 'Paused' | 'Done'

export type Task = {
	id: string,
	name: string,
	due: Date,
	status: TaskStatus,
	assigned: User[]
	subtasks: string[],
	parent: string[],
	estimate: number,
	project: string[]
}

export type User = {
	id: string,
	name: string,
	profile: string
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