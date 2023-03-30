import type { Category, RecipeContent } from "@ts/meals";

export const extractCategories = (recipes: RecipeContent[]) => {
	const categories: string[] = [];

	recipes.forEach((recipe) => {
		recipe?.data?.categories?.forEach((category) => {
			categories.push(category);
		});
	});
	
	return categories.filter((cat, index) => categories.indexOf(cat) === index);
}

export const buildCategories = (cats: string[]) => {
	const categories: Category[] = []

	cats.forEach((cat) => {
		categories.push({
			label: cat,
			slug: cat.toLowerCase().replace(/\s/g, '-')
		})
	})

	return categories
}

const generateCategories = (recipes: RecipeContent[]) => {
	const categories = extractCategories(recipes)
	return buildCategories(categories)
}

export const recipeCategories = (categories: string[]) => {
	return buildCategories(categories)
}

export default generateCategories