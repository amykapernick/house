export type Recipe = {
	name: string
	id: string
	categories?: string[]
	image?: string
	ingredients: string[]
	time?: number
	difficulty?: string
	slug: string
	ingredients?: Ingredient[]
	method?: string
}

export type Ingredient = {
	quantity?: number
	unit?: string
	ingredient: string
	full: string
	format?: string
	category?: string
}

export type Category = {
	label: string
	slug: string
}