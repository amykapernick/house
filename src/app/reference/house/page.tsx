import HouseMap from "@components/partials/HouseMap";
import fetchData from "@utils/fetchData";

export default async function House ()
{
	const { areas, items } = await fetchData({
		authenticated: true,
		gqlQuery: `
			query {
				areas {
					name
					id
					start
					size
					link
					colour
					info {
						value
						type
					}
				}
				items {
					type
					state {
						type
						state
					}
					start
					size
					rotation
					link
					area {
						name
						id
						colour
					}
				}
			}
		`
	})

	return (
		<>
			<h1>House</h1>
			<HouseMap areas={areas} items={items} />
		</>
	)
}