<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import BarChart from '$parts/BarChart.svelte';
	import type { BarChartBar } from '$parts/BarChart.svelte';
	import type { Colour } from '$types/global';

	type HealthMetric = { key: string; label: string | null; value: number; unit: string | null };
	type HealthUser = { slug: string; name: string; colour: Colour | null; health: HealthMetric[] | null };

	let users = $state<HealthUser[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handle(res: any) {
				users = res.users ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: 'health',
				onStale: handle,
				gqlQuery: `
					query {
						users {
							slug
							name
							colour
							health { key label value unit }
						}
					}
				`,
			}).then(handle);
		}
	});

	type MetricCard = { key: string; label: string; unit: string | null; bars: BarChartBar[] };

	// Small multiples, one chart per metric key - metrics have wildly different
	// scales (steps vs body fat % vs blood glucose) so they can't share an axis.
	let metricCards = $derived.by((): MetricCard[] => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this derivation, never read reactively
		const byKey = new Map<string, MetricCard>();

		for (const user of users) {
			for (const metric of user.health ?? []) {
				if (!byKey.has(metric.key)) {
					byKey.set(metric.key, { key: metric.key, label: metric.label ?? metric.key, unit: metric.unit, bars: [] });
				}
				byKey.get(metric.key)!.bars.push({ name: user.name, colour: user.colour ?? 'blue', value: metric.value });
			}
		}

		return [...byKey.values()].sort((a, b) =>
			a.key === 'daily_steps' ? -1 : b.key === 'daily_steps' ? 1 : a.label.localeCompare(b.label)
		);
	});
</script>

<svelte:head>
	<title>Health | Kapers Crewe Household</title>
	<meta name="description" content="Family Health Connect stats" />
</svelte:head>

<h1>Health</h1>

{#if loading}
	<p>Loading...</p>
{:else if metricCards.length === 0}
	<p class="empty">No Health Connect data yet — link a family member's Home Assistant id and make sure their companion app is reporting Health Connect sensors.</p>
{:else}
	<div class="grid">
		{#each metricCards as card (card.key)}
			<figure class="chart-card">
				<BarChart groups={[{ label: '', bars: card.bars }]} unit={card.unit ? ` ${card.unit}` : ''} />
				<figcaption>{card.label}</figcaption>
			</figure>
		{/each}
	</div>
{/if}

<style>
	.empty {
		color: var(--grey);
		font-style: italic;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5em;
	}

	.chart-card {
		margin: 0;
		border: 2px solid var(--navy);
	}

	figcaption {
		text-align: right;
		padding: 1em;
		font-style: italic;
	}
</style>
