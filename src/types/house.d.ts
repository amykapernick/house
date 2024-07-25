export type Area = {
	name: string
	id: AreaId
	start: number[]
	size: number[]
	link?: string
	colour?: string
	items: Item[]
	info: Info[]
}

type AreaId = 'bedroom_main' | 'office_amy' | 'office_dan' | 'kitchen' | 'living' | 'dining'

export type Item = {
	type: ItemType
	start: number[]
	size?: number[]
	link?: string
	rotation?: number
	area: Area
	state?: ItemState[]
}

export type ItemType = 'fan' | 'aircon' | 'tv' | 'fan_pedestol' | 'oven' | 'washing_machine' | 'bed' | 'fridge' | 'fire' | 'switch_light' | 'light' | 'wifi_router' | 'robot_vacuum' | 'lamp' | 'computer' | 'laptop' | 'pi' | 'monitor' | 'camera' | 'alarm' | 'fan_light' | 'doorbell'

export type ItemState = {
	type?: ItemType
	state: 'on' | 'off' | 'error'
}

export type Info = {
	area: Area
	type: InfoType
	value: number
}

export type InfoType = 'temperature' | 'humidity'