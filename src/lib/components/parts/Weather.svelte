<script lang="ts">
	import Card from './Card.svelte';
	import WeatherIcon from './WeatherIcon.svelte';

	let {
		class: className = '',
		temp,
		blurb,
		day,
		description,
		uv,
		uvBand,
		condition,
		sunrise,
		sunset,
		compact = false,
	}: {
		class?: string;
		temp: number | number[] | null;
		blurb: string;
		day: string;
		description: string;
		uv?: string;
		/** From UvIndex.band - "low" | "moderate" | "high" */
		uvBand?: string | null;
		condition?: string | null;
		sunrise?: string | null;
		sunset?: string | null;
		compact?: Boolean;
	} = $props();

	// Matches the banding/colours UvGauge.svelte uses for the same 3-tier scale.
	// TODO: Do we really need to fetch this from the API, or can it be programmatically determined here?
	const UV_BAND_LABELS: Record<string, string> = {
		low: `Low`,
		moderate: `Moderate`,
		high: `High`,
	};

	const formatTemp = (t: number | number[]): string => {
		if (Array.isArray(t)) return `${t[0]}°C/${t[1]}°C`;

		return `${t} °C`;
	};
</script>

<Card
	class={`${className} weather ${compact && 'compact'}`}
	theme="white"
>
	{#if !compact}
		<span class="icon"
			><WeatherIcon
				{condition}
				{sunrise}
				{sunset}
			/></span
		>
	{/if}
	<h3 class="sr-only">Weather</h3>
	<span class="temp">{temp != null ? formatTemp(temp) : '—'}</span>
	<span class="blurb">{blurb} •</span>
	<span class="day">{day}</span>

	<span class="desc">{description}</span>

	<div class="uv">
		<h4 class="subtitle">UV Index</h4>
		<span class={uvBand ? `${uvBand}` : ``}><span class="label">UV</span>{uv}<span class="band">{uvBand ? ` (${UV_BAND_LABELS[uvBand] ?? uvBand})` : ``}</span> </span>
	</div>
</Card>

<style>
	@import '@mixins';

	:global(.card.weather) {
		grid-column: 1 / -1;
		grid-template-areas: 'icon temp temp uv desc' 'icon blurb day uv desc';
		grid-template-columns: auto auto auto auto 1fr;
		align-content: center;
		width: 100%;
		color: var(--text_secondary);
		font-size: 0.9em;
		gap: 0;

		&.compact {
			grid-template-areas: 'day day temp' 'blurb uv temp' 'desc desc desc';
			grid-template-columns: 1fr auto;
			width: auto;
		}
	}

	.icon {
		grid-area: icon;
		margin-right: 0.4em;
		font-size: 3em;
	}

	.temp {
		display: block;
		grid-area: temp;
		color: var(--text_primary);
		font-size: 1.5em;
		font-weight: 700;
	}

	.blurb {
		display: block;
		grid-area: blurb;
	}

	.desc {
		grid-area: desc;
		align-self: center;
	}

	.uv {
		display: flex;
		grid-area: uv;
		flex-direction: column;
		justify-content: center;

		& h4 {
			margin: 0;
			font-size: 1em;
		}

		& span {
			font-size: 1.2em;
			font-weight: 700;
		}

		& .label {
			display: none;
		}

		& .low {
			color: var(--success);
		}

		& .moderate {
			color: var(--warning);
		}

		& .high {
			color: var(--error);
		}
	}

	.uv,
	.temp,
	.day {
		margin-right: 20px;
		padding-right: 20px;
		border-right: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
	}
</style>
