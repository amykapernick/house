<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import type { Weather } from '$types/generated';
	import WeatherIcon from '$components/parts/WeatherIcon.svelte';
	import styles from './index.module.css';

	let {
		weather,
		class: className = '',
	}: {
		weather: Weather | null;
		class?: string;
	} = $props();

	const formatTemp = (value: number | null | undefined) => (value == null ? '—' : `${Math.round(value)}°C`);

	// Today's BOM shortText/extendedText are proper prose ("Sunny.") - prefer them over the
	// raw condition enum (eg. "partlycloudy") straight off the Home Assistant entity state.
	let conditionText = $derived(weather?.forecast?.[0]?.shortText ?? weather?.forecast?.[0]?.extendedText ?? weather?.condition);

	let now = $state(new Date());
	$effect(() => {
		const interval = setInterval(() => (now = new Date()), 60_000);
		return () => clearInterval(interval);
	});

	// Scales each forecast day's low-high range against the week's overall min/max, so bars
	// are comparable to each other rather than each spanning the same visual width regardless
	// of how hot/cold that day actually is.
	let forecastRange = $derived.by(() => {
		const days = weather?.forecast ?? [];
		const temps = days.flatMap((d) => [d.tempLow, d.tempHigh]).filter((t): t is number => t != null);
		return { min: temps.length ? Math.min(...temps) : 0, max: temps.length ? Math.max(...temps) : 1 };
	});

	function barStyle(tempLow: number | null | undefined, tempHigh: number | null | undefined) {
		const { min, max } = forecastRange;
		const span = Math.max(1, max - min);
		const left = tempLow == null ? 0 : ((tempLow - min) / span) * 100;
		const right = tempHigh == null ? 100 : ((tempHigh - min) / span) * 100;
		return `left: ${left}%; width: ${Math.max(4, right - left)}%;`;
	}
</script>

<div class="{styles['weather-card']} {className}">
	{#if !weather}
		<p class={styles.empty}>No weather entity found - tag one with the house_app label in Home Assistant.</p>
	{:else}
		<div class={styles.current}>
			<span
				class={styles.icon}
				aria-hidden="true"
			>
				<WeatherIcon condition={weather.condition} />
			</span>
			<div class={styles.details}>
				<p class={styles.condition}>{conditionText}, {formatTemp(weather.temperature)}</p>
				{#if weather.humidity != null}<p class="humidity">{weather.humidity}% Humidity</p>{/if}
				<p class={styles.time}>{format(now, 'hh:mm a')}</p>
				<p class={styles.date}>{format(now, 'd-MMM')}</p>
			</div>
		</div>

		{#if weather.forecast.length}
			<ul class={styles.forecast}>
				{#each weather.forecast as day (day.date)}
					<li>
						<span class={styles.day}>{format(parseISO(day.date), 'EEE')}</span>
						<span
							class={styles.icon}
							aria-hidden="true"
						>
							<WeatherIcon condition={day.condition} />
						</span>
						<span class={[styles.temp, styles.low]}>{formatTemp(day.tempLow)}</span>
						<span class={styles['bar-track']}>
							<span
								class={styles.bar}
								style={barStyle(day.tempLow, day.tempHigh)}
							></span>
						</span>
						<span class={[styles.temp, 'high']}>{formatTemp(day.tempHigh)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
