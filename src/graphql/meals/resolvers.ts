const meals = [
	{
		title: 'BLT',
		tags: ['sandwich', 'bacon', 'lettuce', 'tomato']
	},
	{
		title: `Nana's Christmas Pudding`,
		tags: ['dessert', 'pudding', 'christmas']
	}
]

const resolvers = {
	Query: {
		meals: (parent, args, context) => {
			// if(!context.auth) {
			// 	throw new Error('Unauthorized')
			// }

			// const meals = fetch('/api/notion', {
			// 	method: 'POST',
			// 	body: JSON.stringify({
			// 		source: 'meals'
			// 	}),
			// 	headers: {
			// 		'Content-Type': 'application/json'
			// 	}
			// })

			return meals
		}
	}
}

export default resolvers