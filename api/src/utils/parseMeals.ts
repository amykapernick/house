import { generateSlug } from "./tools"

const parseMeals = (notionData) => {
	const data = []

	notionData.forEach(meal => {
		const name = meal.properties.Name.title[0]?.plain_text

		if(!name) return

		// TODO: Source and parse method and ingredients from page

		data.push({
			name,
			slug: generateSlug(name),
			id: meal.id,
			book: meal.properties['Recipe Book']?.select?.name,
			categories: meal.properties.Categories?.multi_select.map(category => category.name),
			image: meal.properties.Image?.files[0]?.file.url,
			difficulty: meal.properties.Difficulty?.select?.name,
			page: meal.properties['Page Number']?.number,
			serves: meal.properties.Serves?.number,
			time: meal.properties['Time (Hours)']?.number,
		})
	})

	return data
}

export default parseMeals