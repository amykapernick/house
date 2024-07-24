import styles from './styles.module.css'
import ItemIcon from '@components/parts/house/MapItemIcon'

type Area = {
	name: string
	id: AreaId
	start: number[]
	size: number[]
	link?: string
	colour?: string
}

type AreaId = 'bedroom_main' | 'office_amy' | 'office_dan' | 'kitchen' | 'living' | 'dining'

type Item = {
	type: ItemType
	start: number[]
	size: number[]
	link?: string
	area: AreaId
	state?: 'on' | 'off'
}

type ItemType = 'fan' | 'aircon' | 'tv' | 'fan_pedestol' | 'oven' | 'washing_machine' | 'bed' | 'fridge' | 'fire' | 'light_switch' | 'light' | 'wifi_router' | 'robot_vacuum' | 'lamp'

type Info = {
	area: AreaId
	type: 'temperature' | 'humidity'
	value: number
}

type HouseMapProps = {
	areas: Area[]
	items: Item[]
	info: Info[]
};




const HouseMap = (props: HouseMapProps) => {
	const { areas, items, info } = props;

	const mapData = areas.map(area => ({
		...area,
		info: info.filter(i => i.area === area.id),
		items: items.filter(i => i.area === area.id)
	}))

	return (
		<div>
			<svg className={styles.map} viewBox="0 0 1189 1593" fill="none">
					{mapData.map(area => (
						<g 
							className={styles.area} 
							key={area.name}
							style={{'--colour': `var(--${area.colour || 'primary'})`}}
						>
							<a
								href={area.link}
								target="_blank"
							>
								<rect 
									className={styles.space}
									rx="0" 
									ry="0" 
									x={area.start[0]} 
									y={area.start[1]}
									width={area.size[0]} 
									height={area.size[1]} 
								/>
								<span className="sr-only">{area.name}</span>
								<text 
									className={styles.label}
									x={area.start[0] + 10} 
									y={area.start[1] + 40} 
								>
									{area.name}
								</text>
							</a>
							{area.info.length && (
								<g className={styles.info}>
									{area.info.map((info) => (
										<text
											key={info.value}
											x={area.start[0] + 10}
											y={area.start[1] + 50}
										>
											{info.value} degrees
										</text>
									))}
								</g>
							)}
						</g>
					))}
					<g className={styles.items}>
						{items.map((item) => (
							<a 
								key={item.start[0]} 
								className={styles.item}
								href={item.link}
							>
								<ItemIcon 
									type={item.type}
									state={item.state}
									size={item.size}
									start={item.start}
								/>
							</a>
						))}
					</g>
			</svg>		
		</div>
	);
};

export default HouseMap;
