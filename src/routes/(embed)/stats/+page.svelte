<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import type { Guest } from '$types/stats';


	let guests = $state<Guest[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({

				gqlQuery: `
					query {
						guests {
							dietaries
							age
							meal
							child
						}
					}
				`,
			}).then((res) => {
				guests = res.guests ?? [];
				loading = false;
			});
		}
	});

	let allGuests = $derived.by(() => {
		const counts: Record<string, number> = {
			children: 0,
			teens: 0,
			adults: 0,
			vendors: 0,
			dietaries: 0,
		};

		guests.forEach((guest) => {
			if (guest.child) {
				if (guest.meal === 'Adult') counts.teens++;
				else if (guest.meal === 'Kids') counts.children++;
			} else if (guest.meal === 'Vendor') {
				counts.vendors++;
			} else {
				if (guest.meal === 'Dietary') counts.dietaries++;
				counts.adults++;
			}
		});

		return counts;
	});

	let dietaries = $derived.by(() => {
		const counts: Record<string, number> = {};
		guests.forEach((guest) => {
			if (guest?.dietaries && guest?.dietaries !== '') {
				if (!counts[guest.dietaries]) counts[guest.dietaries] = 0;
				counts[guest.dietaries]++;
			}
		});
		return counts;
	});
</script>

<svelte:head>
	<title>Stats | Kapers Crewe Household</title>
</svelte:head>

<h1>Stats</h1>
{#if loading}
	<p>Loading...</p>
{:else}
	<h2>Meals</h2>
	<dl class="stats">
		<div>
			<dt>All Guests</dt>
			<dd>{Object.values(allGuests).reduce((acc, curr) => acc + curr, 0)}</dd>
		</div>
		<div>
			<dt>Adults</dt>
			<dd>{allGuests.adults}</dd>
		</div>
		<div>
			<dt>Teens</dt>
			<dd>{allGuests.teens}</dd>
		</div>
		<div>
			<dt>Children</dt>
			<dd>{allGuests.children}</dd>
		</div>
		<div>
			<dt>Special Dietary</dt>
			<dd>{allGuests.dietaries}</dd>
		</div>
		<div>
			<dt>Vendors</dt>
			<dd>{allGuests.vendors}</dd>
		</div>
	</dl>

	<h2>Dietary Requirements</h2>
	<table class="table">
		<thead>
			<tr>
				<th>Dietary</th>
				<th>Count</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(dietaries)
				.sort((a, b) => (a[1] === b[1] ? a[0].length - b[0].length : b[1] - a[1])) as [type, count]}
				<tr>
					<td>{type}</td>
					<td>{count}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.stats {
		display: flex;
		flex-wrap: wrap;
		font-size: 1.5em;
		font-weight: 500;
		text-align: center;
		gap: 10px;

		& > * {
			flex: 1 1 auto;
			padding: 0.5em;
			border-radius: 0.2em;
			background: rgba($blue, 0.3);
		}

		& dd {
			margin: 0;
			font-size: 1.5em;
			font-weight: 700;
		}
	}

	.table {
		max-width: 500px;

		& td {
			&:nth-child(2) {
				text-align: center;
			}
		}
	}
</style>
