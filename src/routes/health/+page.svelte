<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import Chart from '$components/parts/graph/Chart.svelte';
	import type { LineChartLine } from '$components/parts/graph/LineChart/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import type { Colour } from '$types/global';
	import { getPageTitle } from '$utils/pageTitle';

	type HealthMetricPoint = { date: string; value: number };
	type HealthMetricHistory = { key: string; label: string | null; unit: string | null; points: HealthMetricPoint[] };
	type HealthUser = { slug: string; name: string; colour: Colour | null; healthHistory: HealthMetricHistory[] | null };

	const DAY_OPTIONS = [7, 30, 90] as const;

	let days = $state<number>(30);
	let users = $state<HealthUser[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			loading = true;
			function handle(res: any) {
				users = res.users ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: `health-history-${days}`,
				onStale: handle,
				gqlQuery: `
					query {
						users {
							slug
							name
							colour
							healthHistory(days: ${days}) { key label unit points { date value } }
						}
					}
				`,
			}).then(handle);
		}
	});

	// TODO: Reorganise health history data so that different values can be fetched

	type MetricCard = { key: string; label: string; unit: string | null; lines: LineChartLine[] };

	// Small multiples, one chart per metric key - metrics have wildly different
	// scales (steps vs body fat % vs blood glucose) so they can't share an axis.
	// Within one metric, every line shares a unit (it's the same metric for
	// everyone), so multiple family members can safely share one axis.
	let metricCards = $derived.by((): MetricCard[] => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this derivation, never read reactively
		const byKey = new Map<string, MetricCard>();

		for (const user of users) {
			for (const metric of user.healthHistory ?? []) {
				if (!metric.points.length) continue;

				if (!byKey.has(metric.key)) {
					byKey.set(metric.key, { key: metric.key, label: metric.label ?? metric.key, unit: metric.unit, lines: [] });
				}
				byKey.get(metric.key)!.lines.push({
					data: metric.points.map((p) => ({ x: parseISO(p.date), y: p.value })),
					style: { colour: user.colour ?? 'blue' },
					unit: metric.unit ?? '',
					decimals: 0,
				});
			}
		}

		return [...byKey.values()].sort((a, b) => (a.key === 'daily_steps' ? -1 : b.key === 'daily_steps' ? 1 : a.label.localeCompare(b.label)));
	});

	// Colours are stable per-person across every chart on the page, so one shared
	// legend suffices - LineChart (unlike BarChart) has no built-in legend.
	let legend = $derived(users.filter((u) => (u.healthHistory ?? []).some((m) => m.points.length)));
</script>

<svelte:head>
	<title>{getPageTitle(`Health`)}</title>
	<meta
		name="description"
		content="Family Health Connect stats"
	/>
</svelte:head>

<h1>Health</h1>

<fieldset class="range_filter">
	<legend>Show</legend>
	{#each DAY_OPTIONS as option (option)}
		<div class="option">
			<input
				type="radio"
				id="days-{option}"
				name="days"
				value={option}
				bind:group={days}
			/>
			<label for="days-{option}">{option} days</label>
		</div>
	{/each}
</fieldset>

{#if loading}
	<Skeleton rows={3} />
{:else if metricCards.length === 0}
	<EmptyState
		title="No Health Connect data yet"
		message="Link a family member's Home Assistant id and make sure their companion app is reporting Health Connect sensors."
	/>
{:else}
	{#if legend.length > 1}
		<ul class="legend">
			{#each legend as user (user.slug)}
				<li>
					<span
						class="swatch"
						style="background: var(--{user.colour ?? 'blue'});"
					></span>
					<span>{user.name}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="grid">
		<!-- TODO: Remove device name from caption -->
		{#each metricCards as card (card.key)}
			<Chart
				type="line"
				lines={card.lines}
				formatX={(x) => format(x, DATE_FORMATS.short)}
				leftLabel={card.unit ?? undefined}
				caption={card.label}
				class="chart-card"
			/>
		{/each}
	</div>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.range_filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 1em;
		padding: 0;
		border: none;
		gap: 1em;

		& legend {
			padding: 0;
			font-weight: bold;
		}

		& .option {
			display: flex;
			align-items: center;
			gap: 0.3em;
		}
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		margin: 0 0 1.5em;
		padding: 0;
		font-size: 0.9em;
		list-style: none;
		gap: 0.3em 1.2em;

		& li {
			display: flex;
			align-items: center;
			gap: 0.5em;
		}
	}

	.swatch {
		flex-shrink: 0;
		width: 0.8em;
		height: 0.8em;
		border-radius: 0.15em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5em;
	}

	:global(.chart-card) {
		margin: 0;
	}
</style>
