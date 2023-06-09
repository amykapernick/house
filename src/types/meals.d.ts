export type Recipe = {
	title: string
	categories?: string[] | undefined
	image?: string | undefined
	ingredients: string[]
	time?: number | undefined
	difficulty?: string | undefined
}

export type RecipeContent = {
	id: string
	slug: string
	body: string
	collection: string
	data: Recipe
	render: any
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