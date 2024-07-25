import Fan from '@img/house/fan.svg'
import Light from '@img/house/light.svg'
import FanLight from '@img/house/fan-light.svg'
import Aircon from '@img/house/aircon.svg'
import TV from '@img/house/vintage-tv.svg'
import FanPedestol from '@img/house/fan-2.svg'
import Oven from '@img/house/oven.svg'
import WashingMachine from '@img/house/washing-machine.svg'
import Bed from '@img/house/double-bed.svg'
import Fridge from '@img/house/fridge.svg'
import Fire from '@img/house/fireplace.svg'
import LightSwitch from '@img/house/light-control.svg'
import WifiRouter from '@img/house/router.svg'
import RobotVacuum from '@img/house/robot-cleaner.svg'
import Lamp from '@img/house/floor-lamp.svg'
import Computer from '@img/house/computer.svg'
import Laptop from '@img/house/laptop.svg'
import Pi from '@img/house/raspberry-pi.svg'
import Monitor from '@img/house/monitor.svg'
import Camera from '@img/house/security-camera.svg'
import Alarm from '@img/house/alarm.svg'
import styles from './styles.module.css'
import type { ItemState, ItemType } from '@ts/house'

type ItemIconProps = {
	type: ItemType
	state?: ItemState[]
	start: number[]
	size: number[]
	className?: string
}

const ItemIcons: Record<string, any> = {
	fan: Fan,
	light: Light,
	fan_light: FanLight,
	aircon: Aircon,
	tv: TV,
	fan_pedestol: FanPedestol,
	oven: Oven,
	washing_machine: WashingMachine,
	bed: Bed,
	fridge: Fridge,
	fire: Fire,
	switch_light: LightSwitch,
	wifi_router: WifiRouter,
	robot_vacuum: RobotVacuum,
	lamp: Lamp,
	computer: Computer,
	laptop: Laptop,
	pi: Pi,
	monitor: Monitor,
	camera: Camera,
	alarm: Alarm,
}

const ItemIcon = (props: ItemIconProps) => {
	let {type, state, start, size, className = '', ...attrs} = props
	const Icon: any = ItemIcons[type]

	if(!Icon) return null
	const dataProps: Record<string, string> = {
		'data-type': type,
	}

	if(!state) {
		dataProps['data-state'] = 'off'
	}
	else if(state?.length === 1) {
		dataProps['data-state'] = state[0].state
	}
	else {
		state.forEach((s) => {
			dataProps[`data-state-${s.type}`] = s.state
		})
	}

	return (
		<Icon
			{...attrs}
			className={[
				className,
				styles.icon,
				styles[type]
			].join(' ')}
			{...dataProps}
		/>
	)
}

export default ItemIcon