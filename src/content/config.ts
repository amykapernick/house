import { defineCollection, z } from 'astro:content';

const recipeBook = defineCollection({
	schema: z.object({
		title: z.string(),
		categories: z.array(z.string()).optional(),
		image: z.string().optional(),
		ingredients: z.array(z.string()),
		time: z.number().optional(),
		difficulty: z.string().optional()
	})
})

export const collections = {
	'recipes': recipeBook
}