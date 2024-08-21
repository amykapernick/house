import fetchData from '@utils/fetchData';
import styles from './styles.module.css'

export default async function Stats () {	
	const { guests = [] } = await fetchData({
		authenticated: true,
		gqlQuery: `
			query {
				guests {
					name {
						first
						last
					}
					dietaries
					age
					meal
					child
				}
			}
		`
	})
	const dietaries: Record<string, number> = {}
	const allGuests: Record<string, number> = {
		children: 0,
		teens: 0,
		adults: 0,
		vendors: 0,
		dietaries: 0
	}

	guests
		.forEach((guest) => {
			if(guest?.dietaries && guest?.dietaries !== ``) {
				if(!dietaries[guest.dietaries]) {
					dietaries[guest.dietaries] = 0
				}
				dietaries[guest.dietaries]++
			}

			if(guest.child) {
				if(guest.meal === `Adult`) allGuests.teens++

				else if(guest.meal === `Kids`) allGuests.children++
			}
			else if(guest.meal === `Vendor`) {
				allGuests.vendors++
			}
			else {
				if(guest.meal === `Dietary`) allGuests.dietaries++

				allGuests.adults++
			}
		})

	return (
		<>
			<h1>Stats</h1>
			<h2>Meals</h2>
			<dl className={styles.stats}>
				<div>
					<dt>All Guests</dt>
					<dd>
						{Object.values(allGuests).reduce((acc, curr) => acc + curr, 0)}
					</dd>
				</div>
				<div>
					<dt>Adults</dt>
					<dd>
						{allGuests.adults}
					</dd>
				</div>
				<div>
					<dt>Teens</dt>
					<dd>
						{allGuests.teens}
					</dd>
				</div>
				<div>
					<dt>Children</dt>
					<dd>
						{allGuests.children}
					</dd>
				</div>
				<div>
					<dt>Special Dietary</dt>
					<dd>
						{allGuests.dietaries}
					</dd>
				</div>
				<div>
					<dt>Vendors</dt>
					<dd>
						{allGuests.vendors}
					</dd>
				</div>
			</dl>
			<h2>Dietary Requirements</h2>
			<table className={styles.table}>
				<thead>
					<tr>
						<th>Dietary</th>
						<th>Count</th>
					</tr>
				</thead>
				<tbody>
					{Object.entries(dietaries)
						.sort((a, b) => 
							a[1] === b[1] ? a[0].length - b[0].length : b[1] - a[1])
						.map(([type, count]) => (
							<tr key={type}>
								<td>{type}</td>
								<td>{count}</td>
							</tr>
						))
					}
				</tbody>
			</table>
		</>
	)
}