export type Recipe = {
	title: string
	categories: string[]
	image?: string
	ingredients: string[]
	time: number
	difficulty: string
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
	quantity?: number
	unit?: string
	ingredient?: string
	full?: string
	category?: string
}