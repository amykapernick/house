export type Area = {
	name: string
	id: string
	start: number[]
	size: number[]
	link?: string
	colour?: string
	items: Item[]
	info: Info[]
}

export type Item = {
	id: string
	type: ItemType
	start: number[]
	size?: number[]
	link?: string
	rotation?: number
	area?: Area | null
	state?: ItemState[]
	linkedItem?: Item | null
}

export type ItemType = `fan` | `aircon` | `tv` | `fan_pedestol` | `oven` | `washing_machine` | `bed` | `fridge` | `fire` | `switch_light` | `light` | `wifi_router` | `robot_vacuum` | `lamp` | `computer` | `laptop` | `pi` | `monitor` | `camera` | `alarm` | `fan_light` | `doorbell` | `speaker`

export type ItemState = {
	type?: ItemType
	state: `on` | `off` | `error`
}

export type Info = {
	area: Area
	type: InfoType
	value: number
}

export type InfoType = `temperature` | `humidity`
