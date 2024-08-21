import ItemIcon from '@components/parts/house/MapItemIcon'
import InfoItem from '@components/parts/house/InfoItem';
import ItemDefaults from '@data/house/items';
import styles from './styles.module.css'
import type { CSSProperties } from 'react';
import type { Area, Item } from '@ts/house';

type HouseMapProps = {
	areas: Area[]
	items: Item[]
};

const HouseMap = (props: HouseMapProps) => {
	const { areas = [], items = [] } = props;
	const size = [1189, 1593];

	return (
		<div className={styles.container} style={{'--width': size[0], '--height': size[1]} as CSSProperties}>
			<svg className={styles.map} viewBox={`0 0 ${size.join(` `)}`} fill="none" >
				{areas.map(area => (
					<g 
						className={styles.area} 
						key={area.name}
						style={{'--colour': `var(--${area.colour ?? `primary`})`} as CSSProperties}
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
					</g>
				))}
			</svg>		
			{items.map((item) => {
				const itemSize = item.size ?? ItemDefaults[item.type].size;
				return (
					<a 
						key={item.start[0]} 
						className={styles.item}
						href={item.link}
						style={{
							'--width': `${itemSize[0] / size[0] * 100}%`,
							'--height': `${itemSize[1] / size[1] * 100}%`,
							'--offset_x': `${item.start[0] / size[0] * 100}%`,
							'--offset_y': `${item.start[1] / size[1] * 100}%`,
							'--rotate': item.rotation ? `${item.rotation}deg` : 0,
						} as CSSProperties}
					>
						<ItemIcon 
							type={item.type}
							state={item.state}
							size={itemSize}
							start={item.start}
						/>
						<span className="sr-only">Control {item.area.name} ${item.type}</span>
					</a>
				)
			})}
			{areas.map(area => (
				<>
					{area.info?.length ? (
						<ul
							key={area.name} 
							className={styles.info}
							style={{
								'--offset_x': `${area.start[0] / size[0] * 100}%`,
								'--offset_y': `${area.start[1] / size[1] * 100}%`,
								'--width': `${area.size[0] / size[0] * 100}%`,
								'--height': `${area.size[1] / size[1] * 100}%`,
							} as CSSProperties}
						>
							{area.info.map((info) => (
								<li className={styles.stat} key={info.type}>
									<InfoItem
										{...info}
									/>
								</li>
							))}
						</ul>
					) : <></>}
				</>
			))}
		</div>
	);
};

export default HouseMap;
