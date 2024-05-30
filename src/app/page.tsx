import { currentUser } from '@clerk/nextjs/server';

export default async function Home ()
{

	const auth = await currentUser()

	console.log({auth})


	return (
		<>
			<h2>Recipes</h2>
			{/* TODO: Add recipe feed back */}
		</>
	)
}