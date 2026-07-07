export type PaletteColour = {
	name: string
	hex: string
}

export type ScheduleBlock = {
	id: string
	label: string
	start: string
	end: string
	colour: string | null
	isOverride: boolean
}

export type RoutineDayBlock = {
	label: string
	start: string
	end: string
	colour: string | null
}

export type RoutineDays = {
	monday: RoutineDayBlock[]
	tuesday: RoutineDayBlock[]
	wednesday: RoutineDayBlock[]
	thursday: RoutineDayBlock[]
	friday: RoutineDayBlock[]
	saturday: RoutineDayBlock[]
	sunday: RoutineDayBlock[]
}

export type ScheduleSavePayload =
	| { scope: `default`, days: RoutineDays }
	| { scope: `range`, start: string, end: string, days: RoutineDays }
