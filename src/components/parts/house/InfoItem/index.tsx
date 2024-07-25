import type { InfoType } from "@ts/house"
import Temperature from '@img/house/temperature.svg'
import Humidity from '@img/house/humidity.svg'

type InfoItemProps = {
	type: InfoType
	value: number
}

const InfoItem = (props: InfoItemProps) => {
	const { type, value } = props
	let suffix = ''
	let prefix = ''
	let Icon = false

	switch(type) {
		case 'temperature':
			suffix = '°C'
			Icon = Temperature
			break
		case 'humidity':
			suffix = '%'
			Icon = Humidity
			break
	}

	return (
		<>
			{Icon && <Icon />}
			{prefix} {value} {suffix}
		</>
	)
}

export default InfoItem