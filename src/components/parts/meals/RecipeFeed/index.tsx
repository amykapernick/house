'use client'

import RecipeCard from "@parts/meals/RecipeCard"
import { useEffect, useState } from "react"
import styles from './styles.module.css'
import type { Recipe } from "@ts/meals"

type RecipeFeedProps = {
	recipes: Recipe[]
}

const RecipeFeed = (props: RecipeFeedProps) => {
	const { recipes = [] } = props
	const categories: string[] = []
	const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes)
	const [filteredCategories, setFilteredCategories] = useState<string[]>([])
	const setFilter = (category: string) => {
		if (filteredCategories.includes(category)) {
			setFilteredCategories(
				filteredCategories.filter((c) => c !== category)
			)
		}
		else {
			setFilteredCategories([
				...filteredCategories, 
				category
			])
		}
	}

	recipes.forEach((recipe) => {
		recipe.categories?.forEach((category) => {
			if (!categories.includes(category)) categories.push(category)
		})
	})

	useEffect(() => {
		setFilteredRecipes(
			recipes.filter((recipe) => {
				return filteredCategories.every((category) => {
					return recipe.categories?.includes(category)
				})
			})
		)
	}, [filteredCategories])

	return (
		<div>
			<ul className={styles.categories}>
				{categories.map((category) => (
					<li className={styles.tag} key={category}>
						<button
							onClick={() => setFilter(category)}
							data-pressed={filteredCategories.includes(category)}
						>
							{category}
						</button>
					</li>
				))}
			</ul>
			<ul className={styles.cards}>
				{
					filteredRecipes?.map((recipe) => (
						<li key={recipe.id}>
							<RecipeCard {...recipe} />
						</li>
					))
				}
			</ul>
		</div>
	)
}

export default RecipeFeed