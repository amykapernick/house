<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import Card from './Card.svelte';
	import WeatherIcon from './WeatherIcon.svelte';
	import { getUvBand } from '$utils/weather/uvBand';

	let {
		class: className = '',
		temp,
		blurb,
		day,
		description,
		uv,
		condition,
		sunrise,
		sunset,
		children,
	}: {
		class?: string;
		temp: number | number[] | null;
		blurb: string;
		day: string;
		description: string;
		uv?: number | string | null;
		condition?: string | null;
		sunrise?: string | null;
		sunset?: string | null;
		children?: Snippet;
	} = $props();

	let uvValue = $derived(uv != null && uv !== `` ? Number(uv) : null);
	let uvBand = $derived(uvValue != null && !Number.isNaN(uvValue) ? getUvBand(uvValue) : null);

	const formatTemp = (t: number | number[]): string => {
		if (Array.isArray(t)) return `${t[0]}°C/${t[1]}°C`;

		return `${t} °C`;
	};
</script>

<Card
	class={`${className} weather`}
	theme="white"
>
	<span class="icon"
		><WeatherIcon
			{condition}
			{sunrise}
			{sunset}
		/></span
	>
	<h3 class="sr-only">Weather</h3>
	<span class="temp">{temp != null ? formatTemp(temp) : '—'}</span>
	<span class="blurb">{blurb} •</span>
	<span class="day">{day}</span>

	<span class="desc">{description}</span>

	{#if uv}
		<div class="uv">
			<h4 class="subtitle">UV Index</h4>
			<span style={uvBand ? `--uv-colour: ${uvBand.colour}` : ``}>
				{uv}
				<span class="band">{uvBand ? ` (${uvBand.label})` : ``}</span>
			</span>
		</div>
	{/if}
	{#if children}
		<div class="children">{@render children()}</div>
	{/if}
</Card>

<style>
	@import '@mixins';

	:global(.card.weather) {
		grid-column: 1 / -1;
		grid-template-areas: 'icon temp temp uv desc' 'icon blurb day uv desc' 'child child child child child';
		grid-template-columns: auto auto auto auto 1fr;
		align-content: center;
		width: 100%;
		color: var(--text_secondary);
		font-size: 0.9em;
		gap: 0;
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
		margin-right: 0.6ch;
	}

	.day {
		grid-area: day;
	}

	.desc {
		grid-area: desc;
		align-self: center;
	}

	.children {
		grid-area: child;
		margin-top: 1em;
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
			color: var(--uv-colour, inherit);
			font-size: 1.2em;
			font-weight: 700;
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
