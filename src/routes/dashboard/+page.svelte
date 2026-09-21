<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import Panel from '$parts/Dashboard/Panel/index.svelte';
	import WeatherCard from '$parts/Dashboard/WeatherCard/index.svelte';
	import AstroCard from '$parts/Dashboard/AstroCard/index.svelte';
	import UvGauge from '$parts/Dashboard/UvGauge/index.svelte';
	import BinDaysCard from '$parts/Dashboard/BinDaysCard/index.svelte';
	import SeasonCard from '$parts/Dashboard/SeasonCard/index.svelte';
	import type { House } from '$types/generated';

	let dashboard = $state<House | null>(null);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handle(res: any) {
				dashboard = res.house ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: `dashboard`,
				onStale: handle,
				gqlQuery: `
					query {
						house {
							weather {
								condition
								temperature
								humidity
								forecast { date condition tempHigh tempLow precipitationChance shortText extendedText }
							}
							sun {
							sunrise sunset dawn dusk solarNoon moonrise moonset moonPhase
							sunElevation moonElevation moonAzimuth southernHemisphere
							path { time sunElevation moonElevation }
						}
							uv { value }
							binCollections { binType nextDate }
							currentSeason { name months colour subtitle description }
						}
					}
				`,
			}).then(handle);
		}
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Dashboard`)}</title>
	<meta
		name="description"
		content="Weather, astro, UV, and bin day widgets"
	/>
</svelte:head>

<h1 class={`${!loading && 'sr-only'}`}>Dashboard</h1>

{#if loading}
	<Skeleton rows={4} />
{:else}
	<div class="grid">
		<Panel
			title="Astro"
			headingVisible={false}
			class="card"
		>
			<AstroCard sun={dashboard?.sun ?? null} />
		</Panel>
		<Panel
			title="Weather"
			headingVisible={false}
			class="card"
		>
			<WeatherCard weather={dashboard?.weather ?? null} />
		</Panel>
		<Panel
			title="UV Index"
			headingVisible={false}
			class="card"
		>
			<UvGauge uv={dashboard?.uv ?? null} />
		</Panel>
		<Panel
			title="Bin Days"
			headingVisible={false}
			class="card wide"
		>
			<BinDaysCard bins={dashboard?.binCollections ?? []} />
		</Panel>
		<Panel
			title="Season"
			headingVisible={false}
			class="card"
		>
			<SeasonCard season={dashboard?.currentSeason ?? null} />
		</Panel>
	</div>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5em;
	}

	/* :global, not scoped like .grid above - Panel (a child component) renders
	   the section this class lands on, so this page's own template never
	   contains the element directly and Svelte's default scoping can't reach it. */

	:global(.card) {
		padding: 1.5em;
		border: 1px solid light-dark(var(--border), color-mix(in oklch, var(--dark_background) 78%, var(--white)));
		border-radius: 1em;
		background: light-dark(linear-gradient(var(--white_true) 0%, color-mix(in oklch, var(--background) 55%, var(--white_true)) 100%), linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)) 0%, color-mix(in oklch, var(--dark_background) 90%, var(--white)) 100%));
		box-shadow: var(--shadow_card);
	}

	@media (width >= 60em) {
		.grid {
			gap: 2em;
		}

		:global(.card.wide) {
			grid-column: span 3;
		}
	}
</style>
