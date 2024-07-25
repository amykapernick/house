export type Recipe = {
	name: string
	id: string
	categories?: string[]
	image?: string
	ingredients: string[]
	time?: number
	difficulty?: string
	slug: string
}

export type Ingredient = {
	quantity?: number | undefined
	unit?: string | undefined
	ingredient: string
	full: string
	category?: string | undefined
}

export type Category = {
	label: string
	slug: string
}