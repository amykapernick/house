import styles from './styles.module.css'

export type Colour = {
	name: string,
	value: string,
	contrast: {
		value: string,
		ratio: number
	}
}

const ColourSwatches = (props: {colours: Colour[]}) => {
	const { colours } = props

	return (
		<ul className={styles.palette}>
			{colours.map(({name, value, contrast}) => (
				<li 
					key={name} 
					style={{'--colour': value, '--contrast': contrast.value}} 
					className={styles.swatch}
					data-standard={contrast.ratio < 3 ? 'fail' : contrast.ratio < 4.5 ? 'a' : contrast.ratio < 7 ? 'aa' : 'aaa'}
				>
					<span className={styles.name}>{name}</span>
					<span className={styles.value}>{value}</span>
					<details className={styles.a11y}>
						<summary className={styles.standard}>
							{contrast.ratio < 3 ? 'Fails A ❌' : contrast.ratio < 4.5 ? 'Passes A' : contrast.ratio < 7 ? 'Passes AA ✅' : 'Passes AAA 🥳'}
						</summary>
						<span>Paired with {contrast.value}, contrast ratio of {contrast.ratio.toFixed(2)}:1</span>
					</details>
				</li>
			))}
		</ul>
	)
}

export default ColourSwatches