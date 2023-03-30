import type { RecipeContent } from "@ts/meals"
import { useEffect, useState } from "react"
import RecipeCard from "../recipeCard"

import styles from "./styles.module.css"

const days = [
	{
		name: 'Sat',
		number: 6
	},
	{
		name: 'Sun',
		number: 0
	},
	{
		name: 'Mon',
		number: 1
	},
	{
		name: 'Tue',
		number: 2
	},
	{
		name: 'Wed',
		number: 3
	},
	{
		name: 'Thu',
		number: 4
	},
	{
		name: 'Fri',
		number: 5
	}
]

const MealPlanner = (props: {recipes: RecipeContent[]}) => {
	const {recipes} = props
	const localRecipes = localStorage.getItem('recipes')
	const [savedRecipes, setRecipes] = useState([])
	const [currentWeek, setCurrentWeek] = useState('2023-03-25')
	const [currentRecipes, setCurrentRecipes] = useState<string[]>([])
	const allRecipes: Record<string, RecipeContent> = {}

	recipes.forEach(recipe => {
		allRecipes[recipe.slug] = recipe
	})

	useEffect(() => {
		if(!localRecipes) {
			const data = {[currentWeek]: []}
			localStorage.setItem('recipes', JSON.stringify(data))
			return;
		}

		const data = JSON.parse(localRecipes)
		setRecipes(data)
		setCurrentRecipes(data[currentWeek] || [])
	}, [])
	
	return (
		<>
			<ul className={styles.week}>
				{days.map(({name, number}) => (
					<li className={styles.day} key={number}>
						<h2>{name}</h2>
						{currentRecipes[number] && 
							<RecipeCard recipe={allRecipes[currentRecipes[number]]} />
						}
					</li>
				))}
			</ul>
		</>
	)
}

export default MealPlanner