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
import Doorbell from '@img/house/doorbell.svg'
import Speaker from '@img/house/speaker.svg'

type ItemDefaultsType = Record<
	string, 
	{
		size: number[], 
		Icon: any
	}
>

const ItemDefaults: ItemDefaultsType = {
	fan: {
		size: [150, 150],
		Icon: Fan
	},
	light: {
		size: [30, 30],
		Icon: Light
	},
	fan_light: {
		size: [150, 150],
		Icon: FanLight
	},
	aircon: {
		size: [100, 50],
		Icon: Aircon
	},
	tv: {
		size: [100, 50],
		Icon: TV
	},
	fan_pedestol: {
		size: [50, 50],
		Icon: FanPedestol
	},
	oven: {
		size: [50, 100],
		Icon: Oven
	},
	washing_machine: {
		size: [100, 100],
		Icon: WashingMachine
	},
	bed: {
		size: [30, 30],
		Icon: Bed
	},
	fridge: {
		size: [200, 250],
		Icon: Fridge
	},
	fire: {
		size: [200, 100],
		Icon: Fire
	},
	switch_light: {
		size: [30, 30],
		Icon: LightSwitch
	},
	wifi_router: {
		size: [30, 30],
		Icon: WifiRouter
	},
	robot_vacuum: {
		size: [50, 50],
		Icon: RobotVacuum
	},
	lamp: {
		size: [30, 30],
		Icon: Lamp
	},
	computer: {
		size: [30, 30],
		Icon: Computer
	},
	laptop: {
		size: [100, 50],
		Icon: Laptop
	},
	pi: {
		size: [30, 30],
		Icon: Pi
	},
	monitor: {
		size: [50, 50],
		Icon: Monitor
	},
	camera: {
		size: [30, 30],
		Icon: Camera
	},
	alarm: {
		size: [30, 30],
		Icon: Alarm
	},
	speaker: {
		size: [30, 30],
		Icon: Speaker,
	},
	doorbell: {
		size: [30, 30],
		Icon: Doorbell
	}
}

export default ItemDefaults