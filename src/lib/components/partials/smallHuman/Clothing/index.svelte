<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { DATE_FORMATS } from '$lib/utils/dateFormats';
	import type { ClothingSeasonal, ClothingDaytime, ClothingSet } from '$types/smallHuman';
	import type { Weather as WeatherData, SunTimes } from '$types/generated';
	import DebugJson from '$parts/DebugJson/index.svelte';
	import Card from '$components/parts/Card/index.svelte';
	import Cards from '$components/parts/Cards/index.svelte';
	import Weather from '$components/parts/Weather/index.svelte';
	import IconChip from '$components/parts/IconChip/index.svelte';
	import Outfit from '$components/parts/smallHuman/Outfit/index.svelte';
	import Plus from '$img/icons/f-add-colored.svg?component';
	import styles from './index.module.css';

	const {
		clothing,
		weather: weatherData = null,
		class: className = '',
	}: {
		clothing: { seasonal: ClothingSeasonal; daytime: ClothingDaytime };
		weather?: WeatherData | null;
		sun?: SunTimes | null;
		class?: string;
	} = $props();

	const { seasonal, daytime } = $derived(clothing);

	const { weather, sun } = $derived(weatherData);

	const formatWeeksCountdown = (weeks) => {
		const suffix = weeks > 1 ? 'weeks' : 'week';
		return `in ${seasonal.noongar_season.weeks_until_next} ${suffix}`;
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
		temp={weather?.temperature ?? daytime.current_recommendation.generated_from_temp}
		description={weather?.forecast?.[0]?.extendedText ?? ''}
		blurb={weather?.forecast?.[0]?.shortText ?? ''}
		day="Today"
		uv={weather?.forecast?.[0]?.uvIndex ?? ''}
		condition={weather?.forecast?.[0]?.condition}
		sunrise={sun?.sunrise}
		sunset={sun?.sunset}
	/>
	<Card
		theme="white"
		class="season"
	>
		<h3 class="subtitle">Current Season</h3>
		<span class={styles.period}><strong>{seasonal.noongar_season.current}</strong> • {seasonal.noongar_season.current_period}</span>
		<p>{seasonal.noongar_season.current_description}</p>
	</Card>
	<Card
		theme="white"
		class="season"
	>
		<h3 class="subtitle">Next Season • {formatWeeksCountdown(seasonal.noongar_season.weeks_until_next)}</h3>
		<span class={styles.period}><strong>{seasonal.noongar_season.next}</strong> • {seasonal.noongar_season.next_period}</span>
		<p>{seasonal.noongar_season.next_description}</p>
	</Card>
	<div></div>
</Cards>

<h3 class="subtitle">Today - Indoors</h3>
<p>{daytime.current_recommendation.indoor.summary}</p>
<div class={styles.chips}>
	{#each daytime.current_recommendation.indoor.layers as layer (layer.position)}
		<Outfit {layer} />
	{/each}
	{#if feetOutfit(daytime.current_recommendation.indoor)}
		<Outfit outfit={feetOutfit(daytime.current_recommendation.indoor)} />
	{/if}
</div>

<h3 class="subtitle">Today - Outdoors <em>(add to indoor layers)</em></h3>
<p>{daytime.current_recommendation.outdoor.summary}</p>
<div class={styles.chips}>
	{#each daytime.current_recommendation.outdoor.layers as layer (layer.position)}
		<Outfit {layer} />
	{/each}
	{#if feetOutfit(daytime.current_recommendation.outdoor)}
		<Outfit outfit={feetOutfit(daytime.current_recommendation.outdoor)} />
	{/if}
</div>

<h3 class="subtitle">Recommended Extras</h3>

<div class={styles.chips}>
	{#if daytime.current_recommendation.outdoor.rain_suit}
		<Outfit outfit="rain" />
	{/if}
	{#if daytime.current_recommendation.outdoor.extras?.hat}
		<Outfit
			outfit="hat"
			label={daytime.current_recommendation.outdoor.extras.hat_reason ?? undefined}
		/>
	{/if}
	{#if daytime.current_recommendation.outdoor.extras?.beanie}
		<Outfit outfit="beanie" />
	{/if}
	{#if daytime.current_recommendation.outdoor.extras?.mittens}
		<Outfit outfit="mittens" />
	{/if}
	{#if daytime.current_recommendation.outdoor.extras?.sunscreen}
		<Outfit
			outfit="sunscreen"
			label={daytime.current_recommendation.outdoor.extras.sunscreen_reason ?? undefined}
		/>
	{/if}
</div>

<h3>Tonight</h3>

<!-- TODO: Add tonight clothing recommendation -->

<h3>Forecast</h3>
<Cards>
	{#each daytime.forecast as day, i (day.date)}
		<Weather
			temp={day.temp ?? null}
			description={weather?.forecast?.[i]?.extendedText ?? ''}
			blurb={weather?.forecast?.[i]?.shortText ?? ''}
			day={format(parseISO(day.date), DATE_FORMATS.dayName)}
			uv={weather?.forecast?.[i]?.uvIndex != null ? String(weather.forecast[i].uvIndex) : ''}
			condition={weather?.forecast?.[i]?.condition}
		>
			<div class={styles.layers}>
				{#each day.indoor?.layers ?? [] as layer, j (j)}
					<Outfit {layer} />
				{/each}
				<span class={styles.plus}><Plus /></span>
				{#each day?.outdoor?.layers ?? [] as layer, k (k)}
					<Outfit {layer} />
				{/each}
			</div>
		</Weather>
	{/each}
</Cards>

<h3 class="subtitle">Current Sizes</h3>

<!-- TODO: Add current sizes -->
