import {defineCollection, z} from 'astro:content';

const recipeBook = defineCollection({
	schema: z.object({
		title: z.string(),
		categories: z.array(z.string()),
		image: z.string().optional(),
		ingredients: z.array(z.string()),
		time: z.number(),
		difficulty: z.string()
	})
})

export const collections = {
	'recipes': recipeBook
}