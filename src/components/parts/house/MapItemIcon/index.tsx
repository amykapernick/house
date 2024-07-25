import Fan from '@img/house/fan.svg'
import Light from '@img/house/light.svg'
import FanLight from '@img/house/fan-light.svg'
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
}

const ItemIcon = (props: ItemIconProps) => {
	let {type, state, start, size, className = '', ...attrs} = props
	const Icon = ItemIcons[type]

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