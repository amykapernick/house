<script lang="ts">
	import type { UvIndex } from '$types/generated';
	import { getUvBand } from '$utils/weather/uvBand';

	let {
		uv,
		class: className = '',
	}: {
		uv: UvIndex | null;
		class?: string;
	} = $props();

	// Matches the scale/bands already used on the existing Home Assistant gauge card
	// (green 0-3, yellow 3-6, red 6+, scale 0-15).
	const MAX_SCALE = 15;
	const BANDS: { from: number; to: number; colour: string }[] = [
		{ from: 0, to: 3, colour: 'green' },
		{ from: 3, to: 6, colour: 'yellow' },
		{ from: 6, to: MAX_SCALE, colour: 'red' },
	];

	const CX = 100;
	const CY = 100;
	const R = 80;

	// Semi-circle gauge, pivoted at the bottom-center - reuses the same polar() convention
	// as PieChart/AstroCard (0deg = 12 o'clock, clockwise), restricted to a -90..90 sweep.
	function polar(r: number, angleDeg: number): [number, number] {
		const rad = ((angleDeg - 90) * Math.PI) / 180;
		return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
	}

	function angleFor(value: number): number {
		return (Math.min(MAX_SCALE, Math.max(0, value)) / MAX_SCALE) * 180 - 90;
	}

	function bandPath(from: number, to: number): string {
		const [x1, y1] = polar(R, angleFor(from));
		const [x2, y2] = polar(R, angleFor(to));
		const largeArc = angleFor(to) - angleFor(from) > 180 ? 1 : 0;
		return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
	}

	let needleAngle = $derived(uv ? angleFor(uv.value) : -90);
	let needleTip = $derived(polar(R - 25, needleAngle));
	let uvBand = $derived(uv ? getUvBand(uv.value) : null);
</script>

<div class="uv-gauge {className}">
	{#if !uv}
		<p class="empty">No UV entity found - tag one with the house_app label in Home Assistant.</p>
	{:else}
		<svg viewBox="0 0 200 115" class="gauge" role="img" aria-label="UV index {uv.value}, {uvBand?.label}">
			{#each BANDS as band (band.colour)}
				<path d={bandPath(band.from, band.to)} fill="none" stroke="var(--{band.colour})" stroke-width="16" />
			{/each}
			<line x1={CX} y1={CY} x2={needleTip[0]} y2={needleTip[1]} class="needle" />
			<circle cx={CX} cy={CY} r="6" class="pivot" />
			<text x={CX} y={CY - 24} class="value" text-anchor="middle">{uv.value.toFixed(1)}</text>
		</svg>
		<p class="caption">UV Index</p>
	{/if}
</div>

<style>
	.uv-gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3em;
	}

	.empty {
		color: var(--grey);
	}

	.gauge {
		width: 100%;
		max-width: 220px;
		height: auto;
	}

	.needle {
		stroke-width: 3;
		stroke-linecap: round;
		stroke: var(--background_text);
	}

	.pivot {
		fill: var(--background_text);
	}

	.value {
		fill: var(--background_text);
		font-size: 22px;
		font-weight: 700;
	}

	.caption {
		margin: 0;
		color: var(--grey);
	}
</style>
