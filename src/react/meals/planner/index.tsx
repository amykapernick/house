import type { RecipeContent } from "@ts/meals"
import { addDays, format, parse } from "date-fns"
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
	const [currentRecipes, setCurrentRecipes] = useState<string[][]>([])
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
			<p>{format(parse(currentWeek, 'yyyy-MM-dd', new Date()), 'dd MMM')} - {format(addDays(parse(currentWeek, 'yyyy-MM-dd', new Date()), 6), 'dd MMM')}</p>
			<ul className={styles.week}>
				{days.map(({name, number}) => (
					<li className={styles.day} key={number}>
						<h2>{name}</h2>
						{currentRecipes[number] && 
							<ul className={styles.cards}>
								{currentRecipes[number].map(recipe => (
								<li key={recipe}><RecipeCard recipe={allRecipes[recipe]} /></li>
							))}
							</ul>
						}
					</li>
				))}
			</ul>
		</>
	)
}

export default MealPlanner