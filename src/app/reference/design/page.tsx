import ColourSwatches, { Colour } from '@components/parts/swatch'
import colours from '@styles/config/colours.cjs'
import variables from '@styles/config/variables.cjs'
import colourContrast from '@utils/contrast'

const formatColour = (slug: string, value: string) => {
	let name = slug
	let contrast = {
		value: colours.neutral,
		ratio: 0
	}

	name = name.replace(/(light_|dark_)/, '')
	name = name.replace(/_/g, ', ')
	name = name.replace(/-/g, ' ')
	name = name.replace(/\+/g, ' & ')
	name = name.replace(/\b\w/g, (char) => char.toUpperCase())

	Object.values(colours).forEach((colour) => {
		if(typeof colour !== 'string') return;

		const { ratio } = colourContrast(value, colour)
		if (ratio > contrast.ratio) {
			contrast = {
				value: colour,
				ratio: ratio
			}
		}
	})

	return ({
		name,
		value: value,
		contrast
	})
}

export default async function Design ()
{
	const colourNames = ['grey', 'brown', 'maroon', 'purple', 'blue', 'teal', 'green', 'yellow', 'orange', 'red', 'pink', 'white', 'black', 'neutral']
	const colourTheme: {
		defaults: Colour[],
		themes: {
			light: Colour[],
			dark: Colour[]
		},
		named: Colour[]
	} = {
		defaults: [],
		themes: {
			light: [],
			dark: [],
		},
		named: []
	}
	
	// Loop through the variables object and filter by only items where the key starts with "font_". Put all the items into an array where the structure is {name: string, value: string} and remove any "font_" from the front of the title, replace any remaining "_" with a space and capitalise the first letter of each word in the name
	const fonts = Object.entries(variables)
		.filter(([name]) => name.startsWith('font_'))
		.map(([name, value]) => ({
			name: name
				.replace(/font_/, '')
				.replace(/_/g, ' ')
				.replace(/\b\w/g, (char) => char.toUpperCase()),
			value: value.split(', ')	
		}))
	

	Object.entries(colours).forEach(colour => {
		const [name] = colour
		if (colourNames.some(colourName => name.startsWith(colourName))) {
			colourTheme.defaults.push(formatColour(...colour))
		} else if (name.startsWith('light_')) {
			colourTheme.themes.light.push(formatColour(...colour))
		} else if (name.startsWith('dark_')) {
			colourTheme.themes.dark.push(formatColour(...colour))
		} else {
			colourTheme.named.push(formatColour(...colour))
		}
	})

	return (
		<>
			<h1>Design</h1>
			<h2>Default Colours</h2>
			<ColourSwatches colours={colourTheme.defaults} />
			<h2>Themes</h2>
			<h3>Light</h3>
			<ColourSwatches colours={colourTheme.themes.light} />
			<h3>Dark</h3>
			<ColourSwatches colours={colourTheme.themes.dark} />
			<h2>Named Colours</h2>
			<ColourSwatches colours={colourTheme.named} />
			<h2>Fonts</h2>
				{fonts.map(({name, value}) => (
					<div key={name} style={{fontFamily: value}}>
						<h3>{name}</h3>
						<p>{value.map(item => (<span key={item} style={{fontFamily: item}}>{item.replace(/'/g, '')}</span>))}</p>
					</div>
				))}
		</>
	)
}