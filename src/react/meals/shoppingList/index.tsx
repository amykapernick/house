import type { Ingredient, RecipeContent } from "@ts/meals"
import formatIngredients from "@utils/meals/parseIngredients"
import { useEffect, useState } from "react"

import styles from "./styles.module.css"

type IngredientObject = {
	recipe: string
	quantity?: string
}

type IngredientList = {
	item: string
	quantities: IngredientObject[]
}

const ShoppingList = (props: {recipes: RecipeContent[]}) => {
	const { recipes } = props
	const localRecipes = localStorage.getItem('recipes')
	const [currentWeek, setCurrentWeek] = useState('2023-03-25')
	const [ingredientsList, setIngredientsList] = useState<IngredientList[]>([])
	const allRecipes: Record<string, RecipeContent> = {}

	recipes.forEach(recipe => {
		allRecipes[recipe.slug] = recipe
	})

	useEffect(() => {
		if(!localRecipes) return;

		const data = JSON.parse(localRecipes)
		const currentRecipes: string[][] = data[currentWeek] || []
		const ingredients: Record<string, IngredientObject[]> = {}

		currentRecipes?.forEach(day => {
			day?.forEach((r: string) => {
				const recipe = allRecipes[r]?.data

				if(!recipe) return;

				const i: Ingredient[] = formatIngredients(recipe.ingredients)
				
				i.forEach(item => {
					const info: IngredientObject = {
						recipe: recipe.title,
					}

					if(!item?.ingredient) {
						console.log({item, recipe})
						return;
					}

					const name: string = item.ingredient.toLowerCase()

					if(item.quantity || item.unit) {
						info.quantity = `${item.quantity || ''} ${item.unit || ''}`
					}

					if(!ingredients[name]) {
						ingredients[name] = []
					}

					ingredients[name].push(info)
				})
			})
		})

		const list: IngredientList[] = Object.keys(ingredients)
		.map(key => 
			({item: key, quantities: ingredients[key]})
		).sort((a, b) => a.item.localeCompare(b.item))

		setIngredientsList(list)

	}, [localRecipes])
	
	return (
		<>
			<ul className={styles.list}>
				{ingredientsList.map(({item, quantities}) => {
					const slug = item.replace(/ /g, '-')
					return (
						<li className={styles.item}>
							<input type="checkbox" name="shopping_list" value={slug} id={slug} />
							<label htmlFor={slug}>{item}</label>
							<ul className={styles.options}>{quantities.map(q => (
								<li>{q.quantity} <em>({q.recipe})</em></li>
							))}</ul>
						</li>
					)
				})}
			</ul>
		</>
	)
}

export default ShoppingList