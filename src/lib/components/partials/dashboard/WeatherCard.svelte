<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import type { Weather } from '$types/generated';
	import WeatherIcon from '$components/parts/WeatherIcon.svelte';

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

<div class="weather-card {className}">
	{#if !weather}
		<p class="empty">No weather entity found - tag one with the house_app label in Home Assistant.</p>
	{:else}
		<div class="current">
			<span
				class="icon"
				aria-hidden="true"
			>
				<WeatherIcon condition={weather.condition} />
			</span>
			<div class="details">
				<p class="condition">{conditionText}, {formatTemp(weather.temperature)}</p>
				{#if weather.humidity != null}<p class="humidity">{weather.humidity}% Humidity</p>{/if}
				<p class="time">{format(now, 'hh:mm a')}</p>
				<p class="date">{format(now, 'd-MMM')}</p>
			</div>
		</div>

		{#if weather.forecast.length}
			<ul class="forecast">
				{#each weather.forecast as day (day.date)}
					<li>
						<span class="day">{format(parseISO(day.date), 'EEE')}</span>
						<span
							class="icon"
							aria-hidden="true"
						>
							<WeatherIcon condition={day.condition} />
						</span>
						<span class="temp low">{formatTemp(day.tempLow)}</span>
						<span class="bar-track">
							<span
								class="bar"
								style={barStyle(day.tempLow, day.tempHigh)}
							></span>
						</span>
						<span class="temp high">{formatTemp(day.tempHigh)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	@import '@mixins';

	.weather-card {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.empty {
		color: var(--grey);
	}

	.current {
		display: flex;
		align-items: center;
		gap: 1em;

		& .icon {
			flex-shrink: 0;
			font-size: 3em;
		}

		& .details {
			flex: 1;

			& p {
				margin: 0;
			}

			& .condition {
				color: var(--grey);
			}

			& .time {
				font-size: 1.8em;
				font-weight: 700;
			}

			& .date {
				color: var(--grey);
			}
		}
	}

	.forecast {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 0.6em;

		& li {
			display: grid;
			grid-template-columns: 3em 1.5em 3em 1fr 3em;
			align-items: center;
			gap: 0.6em;
		}

		& .day {
			color: var(--grey);
		}

		& .icon {
			width: 1.5em;
			height: 1.5em;

			& :global(svg) {
				width: 100%;
				height: 100%;
			}
		}

		& .temp {
			font-variant-numeric: tabular-nums;

			&.low {
				color: var(--grey);
				text-align: right;
			}
		}
	}

	.bar-track {
		position: relative;
		height: 0.5em;
		border-radius: 1em;
		background: var(--grey_light);
	}

	.bar {
		position: absolute;
		height: 100%;
		border-radius: 1em;
		background: linear-gradient(90deg, var(--green_teal), var(--green_lime));
	}
</style>
