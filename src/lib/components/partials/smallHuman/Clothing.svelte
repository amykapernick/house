<script lang="ts">
	import type { ClothingSeasonal, ClothingDaytime, ClothingSet } from '$types/smallHuman';
	import type { Weather as WeatherData, UvIndex, SunTimes } from '$types/generated';
	import DebugJson from '$parts/DebugJson.svelte';
	import Card from '$components/parts/Card.svelte';
	import Cards from '$components/parts/Cards.svelte';
	import Weather from '$components/parts/Weather.svelte';
	import IconChip from '$components/parts/IconChip.svelte';
	import Outfit from '$components/parts/smallHuman/Outfit.svelte';

	const {
		clothing,
		weather = null,
		uv = null,
		sun = null,
		class: className = '',
	}: {
		clothing: { clothing_seasonal: ClothingSeasonal; clothing_daytime: ClothingDaytime };
		weather?: WeatherData | null;
		uv?: UvIndex | null;
		sun?: SunTimes | null;
		class?: string;
	} = $props();

	const { clothing_seasonal, clothing_daytime } = $derived(clothing);

	const formatWeeksCountdown = (weeks) => {
		const suffix = weeks > 1 ? 'weeks' : 'week';
		return `in ${clothing_seasonal.noongar_season.weeks_until_next} ${suffix}`;
	};

	// Bare feet get no chip. Shoes recommended alongside a rain suit become boots instead.
	const feetOutfit = (set: ClothingSet) => {
		if (set.feet === 'socks') return 'socks';
		if (set.feet === 'shoes') return set.rain_suit ? 'boots' : 'shoes';
		return undefined;
	};
</script>

<Cards>
	<Weather
		temp={weather?.temperature ?? clothing_daytime.current_recommendation.generated_from_temp_c}
		description={weather?.forecast?.[0]?.extendedText ?? ''}
		blurb={weather?.forecast?.[0]?.shortText ?? ''}
		day="Today"
		uv={weather?.forecast?.[0]?.uvIndex ?? ''}
		uvBand={uv?.band}
		condition={weather?.condition}
		sunrise={sun?.sunrise}
		sunset={sun?.sunset}
	/>
	<Card
		theme="white"
		class="season"
	>
		<h3 class="subtitle">Current Season</h3>
		<span class="period"><strong>{clothing_seasonal.noongar_season.current}</strong> • {clothing_seasonal.noongar_season.current_period}</span>
		<p>{clothing_seasonal.noongar_season.current_description}</p>
	</Card>
	<Card
		theme="white"
		class="season"
	>
		<h3 class="subtitle">Next Season • {formatWeeksCountdown(clothing_seasonal.noongar_season.weeks_until_next)}</h3>
		<span class="period"><strong>{clothing_seasonal.noongar_season.next}</strong> • {clothing_seasonal.noongar_season.next_period}</span>
		<p>{clothing_seasonal.noongar_season.next_description}</p>
	</Card>
	<div></div>
</Cards>

<h3 class="subtitle">Today - Indoors</h3>
<p>{clothing_daytime.current_recommendation.indoor.summary}</p>
<div class="chips">
	{#each clothing_daytime.current_recommendation.indoor.layers as layer (layer.position)}
		<Outfit {layer} />
	{/each}
	{#if feetOutfit(clothing_daytime.current_recommendation.indoor)}
		<Outfit outfit={feetOutfit(clothing_daytime.current_recommendation.indoor)} />
	{/if}
</div>

<h3 class="subtitle">Today - Outdoors <em>(add to indoor layers)</em></h3>
<p>{clothing_daytime.current_recommendation.outdoor.summary}</p>
<div class="chips">
	{#each clothing_daytime.current_recommendation.outdoor.layers as layer (layer.position)}
		<Outfit {layer} />
	{/each}
	{#if feetOutfit(clothing_daytime.current_recommendation.outdoor)}
		<Outfit outfit={feetOutfit(clothing_daytime.current_recommendation.outdoor)} />
	{/if}
</div>

<h3 class="subtitle">Recommended Extras</h3>

<div class="chips">
	{#if clothing_daytime.current_recommendation.outdoor.rain_suit}
		<Outfit outfit="rain" />
	{/if}
	{#if clothing_daytime.current_recommendation.outdoor.extras?.hat}
		<Outfit
			outfit="hat"
			label={clothing_daytime.current_recommendation.outdoor.extras.hat_reason ?? undefined}
		/>
	{/if}
	{#if clothing_daytime.current_recommendation.outdoor.extras?.beanie}
		<Outfit outfit="beanie" />
	{/if}
	{#if clothing_daytime.current_recommendation.outdoor.extras?.mittens}
		<Outfit outfit="mittens" />
	{/if}
	{#if clothing_daytime.current_recommendation.outdoor.extras?.sunscreen}
		<Outfit
			outfit="sunscreen"
			label={clothing_daytime.current_recommendation.outdoor.extras.sunscreen_reason ?? undefined}
		/>
	{/if}
</div>

<h3>Tonight</h3>

<h3>Forecast</h3>
<Cards>
	{#each clothing_daytime.forecast as day, i (day.date)}
		<Weather
			temp={day.temp_low_c && day.temp_high_c ? [day.temp_low_c, day.temp_high_c] : null}
			description={weather?.forecast?.[i]?.extendedText ?? ''}
			blurb={weather?.forecast?.[i]?.shortText ?? ''}
			day={day.day_label}
			uv={weather?.forecast?.[i]?.uvIndex != null ? String(weather.forecast[i].uvIndex) : ''}
			condition={weather?.condition}
			compact={true}
		/>
	{/each}
</Cards>

<h3 class="subtitle">Current Sizes</h3>

<style>
	:global(.card.season) {
		color: var(--text_secondary);
		font-size: 0.9em;

		& .subtitle {
			margin-top: 0;
			margin-bottom: 0.1em;
			font-size: 1em;
		}

		& .period {
			margin-bottom: 0.5em;
			font-size: 0.8em;
			font-weight: 600;

			& strong {
				color: var(--black);
				font-size: 1.5em;
				font-weight: 700;
			}
		}
	}

	.subtitle {
		margin-bottom: 0;
		font-size: 1.1em;

		& + p {
			margin: 0.5em 0;
		}

		& em {
			font-size: 0.8em;
			font-style: normal;
			font-weight: 500;
			text-transform: none;
		}
	}

	.chips {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
	}
</style>
