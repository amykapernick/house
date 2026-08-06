<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import Card from '../Card/index.svelte';
	import WeatherIcon from '../WeatherIcon.svelte';
	import { getUvBand } from '$utils/weather/uvBand';
	import styles from './index.module.css';

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
	<span class={styles.icon}
		><WeatherIcon
			{condition}
			{sunrise}
			{sunset}
		/></span
	>
	<h3 class="sr-only">Weather</h3>
	<span class={styles.temp}>{temp != null ? formatTemp(temp) : '—'}</span>
	<span class={styles.blurb}>{blurb} •</span>
	<span class={styles.day}>{day}</span>

	<span class={styles.desc}>{description}</span>

	{#if uv}
		<div class={styles.uv}>
			<h4 class="subtitle">UV Index</h4>
			<span style={uvBand ? `--uv-colour: ${uvBand.colour}` : ``}>
				{uv}
				<span class="band">{uvBand ? ` (${uvBand.label})` : ``}</span>
			</span>
		</div>
	{/if}
	{#if children}
		<div class={styles.children}>{@render children()}</div>
	{/if}
</Card>
