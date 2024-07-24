import HouseMap from "@components/partials/HouseMap";
import {areas, items, info} from '@data/mockdata'

export default async function House ()
{
	return (
		<>
			<h1>House</h1>
			<HouseMap areas={areas} items={items} info={info} />
		</>
	)
}