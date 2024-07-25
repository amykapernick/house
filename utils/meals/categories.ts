import type { Category, Recipe } from "@ts/meals";

export const extractCategories = (recipes: Recipe[]) => {
	const categories: string[] = [];

	recipes.forEach((recipe) => {
		recipe?.categories?.forEach((category) => {
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

const generateCategories = (recipes: Recipe[]) => {
	const categories = extractCategories(recipes)
	return buildCategories(categories)
}

export const recipeCategories = (categories: string[]) => {
	return buildCategories(categories)
}

export default generateCategories