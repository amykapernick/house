<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$parts/Skeleton.svelte';
	import WeatherCard from '$partials/dashboard/WeatherCard.svelte';
	import AstroCard from '$partials/dashboard/AstroCard.svelte';
	import UvGauge from '$partials/dashboard/UvGauge.svelte';
	import BinDaysCard from '$partials/dashboard/BinDaysCard.svelte';
	import SeasonCard from '$partials/dashboard/SeasonCard.svelte';
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
		<section class="card">
			<h2 class="sr-only">Astro</h2>
			<AstroCard sun={dashboard?.sun ?? null} />
		</section>
		<section class="card">
			<h2 class="sr-only">Weather</h2>
			<WeatherCard weather={dashboard?.weather ?? null} />
		</section>
		<section class="card">
			<UvGauge uv={dashboard?.uv ?? null} />
		</section>
		<section class="card wide">
			<h2 class="sr-only">Bin Days</h2>
			<BinDaysCard bins={dashboard?.binCollections ?? []} />
		</section>
		<section class="card">
			<h2 class="sr-only">Season</h2>
			<SeasonCard season={dashboard?.currentSeason ?? null} />
		</section>
	</div>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5em;
	}

	.card {
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

		.card {
			&.wide {
				grid-column: span 3;
			}
		}
	}
</style>
