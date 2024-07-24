import Fan from '@img/house/fan.svg'
import Light from '@img/house/light.svg'
import styles from './styles.module.css'

type ItemIconProps = {
	type: string
	state?: string
	start: number[]
	size: number[]
	className?: string
}

const ItemIcons: Record<string, any> = {
	fan: Fan,
	light: Light
}

const ItemIcon = (props: ItemIconProps) => {
	const {type, state = 'off', start, size, className = '', ...attrs} = props
	const Icon = ItemIcons[type]

	if(!Icon) return null

	return (
		<Icon
			{...attrs}
			className={[
				className,
				styles.icon,
				styles[type]
			].join(' ')}
			data-state={state}
			data-type={type}
			x={start[0]} 
			y={start[1]}
			width={size[0]} 
			height={size[1]}  
		/>
	)
}

export default ItemIcon