import type { Ingredient } from "@ts/meals"

export const unitLookup: Record<string, string> = {
	tbsp: 'tablespoon',
	gram: 'g',
	grams: 'g',
	tsp: 'teaspoon'
}

const units: string[] = [
	'tablespoon',
	'clove',
	'piece',
	'g',
	'gram',
	'teaspoon',
	'sprig',
	'handful',
	'bulb',
	'tsp',
	'tbsp',
	'cup',
	'tin',
	'bunch'
]
const matchQuantity: string = '(?<quantity>(\\d|\\/|\\.|-)+(?:cm)*)*'
const matchUnit: string = `(?:(?<unit>${units.join('|')})s* )`
const matchIngredient: string = '(?<ingredient>.+?)'

const formatIngredients = (ingredients: string[]): Ingredient[] => {
	const match: string = `^${matchQuantity} *${matchUnit}*(?:of )*${matchIngredient}$`
	let ingredientList: Ingredient[] = []

	ingredients.forEach(i => {
		let data: Ingredient = {}

		if(i.match(RegExp(/^#/, 'i'))) {
			data.category = i.replace(RegExp(/^#/), '')

		}
		else {
			data.full = i

			const matches = i.match(RegExp(match, 'i'))
	
			if(matches?.groups) {
				data = {
					...data,
					...matches.groups
				}
			}

			if(data.unit && unitLookup[data.unit]) {
				data.unit = unitLookup[data.unit]
			}
		}		

		ingredientList.push(data)
	})

	return ingredientList
}

export default formatIngredients