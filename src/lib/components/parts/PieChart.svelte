<script lang="ts">
	import type { Colour } from '$types/global';

	export type PieSlice = {
		label: string;
		value: number;
		colour: Colour;
	};

	type Props = {
		slices: PieSlice[];
		formatValue?: (v: number) => string;
		centerLabel?: string;
		centerValue?: string;
		class?: string;
	};

	const {
		slices,
		formatValue = (v) => v.toFixed(1),
		centerLabel,
		centerValue,
		class: className = '',
	}: Props = $props();

	const CX = 100;
	const CY = 100;
	const OUTER_R = 90;
	const INNER_R = 52;
	const HOVER_BUMP = 4;
	const GAP_DEG = 2;

	const total = $derived(slices.reduce((sum, s) => sum + Math.max(0, s.value), 0));

	// Slices in compass degrees (0 = 12 o'clock, clockwise), with a small
	// angular gap between adjacent fills (mark spec: 2px surface gap).
	const arcs = $derived.by(() => {
		let angle = 0;
		return slices.map((slice) => {
			const share = total > 0 ? Math.max(0, slice.value) / total : 0;
			const sweep = share * 360;
			const start = angle + (slices.length > 1 ? GAP_DEG / 2 : 0);
			const end = angle + sweep - (slices.length > 1 ? GAP_DEG / 2 : 0);
			angle += sweep;
			return { slice, share, start: Math.min(start, end), end: Math.max(start, end) };
		});
	});

	function polar(r: number, angleDeg: number): [number, number] {
		const rad = ((angleDeg - 90) * Math.PI) / 180;
		return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
	}

	function donutPath(startAngle: number, endAngle: number, outerR: number): string {
		// A single A command can't sweep a full 360deg arc, so a lone slice is
		// drawn just short of a full circle.
		const end = endAngle - startAngle >= 359.99 ? startAngle + 359.98 : endAngle;
		const largeArc = end - startAngle > 180 ? 1 : 0;
		const [x1, y1] = polar(outerR, startAngle);
		const [x2, y2] = polar(outerR, end);
		const [x3, y3] = polar(INNER_R, end);
		const [x4, y4] = polar(INNER_R, startAngle);

		return [
			`M ${x1} ${y1}`,
			`A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
			`L ${x3} ${y3}`,
			`A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${x4} ${y4}`,
			`Z`,
		].join(' ');
	}

	let hoveredIndex = $state<number | null>(null);
</script>

<div class="pie-wrap {className}">
	<svg viewBox="0 0 200 200" class="chart" role="img" aria-label="{slices.map((s) => `${s.label}: ${formatValue(s.value)}`).join(', ')}">
		{#each arcs as { slice, share, start, end }, i (slice.label)}
			{@const outerR = hoveredIndex === i ? OUTER_R + HOVER_BUMP : OUTER_R}
			{@const [labelX, labelY] = polar((outerR + INNER_R) / 2, (start + end) / 2)}
			<path
				d={donutPath(start, end, outerR)}
				style="fill: var(--{slice.colour}); transition: d 0.1s ease;"
				class="slice"
				role="img"
				aria-label="{slice.label}: {formatValue(slice.value)} ({(share * 100).toFixed(0)}%)"
				onmouseenter={() => (hoveredIndex = i)}
				onmouseleave={() => (hoveredIndex = null)}
			/>
			{#if share >= 0.08}
				<text
					x={labelX} y={labelY}
					class="slice-label"
					style="fill: var(--{slice.colour}_text);"
					text-anchor="middle"
					dominant-baseline="middle"
				>
					{(share * 100).toFixed(0)}%
				</text>
			{/if}
		{/each}

		{#if centerValue}
			<text x={CX} y={CY - (centerLabel ? 6 : 0)} class="center-value" text-anchor="middle" dominant-baseline="middle">
				{centerValue}
			</text>
		{/if}
		{#if centerLabel}
			<text x={CX} y={CY + 16} class="center-label" text-anchor="middle" dominant-baseline="middle">
				{centerLabel}
			</text>
		{/if}

		{#if hoveredIndex !== null}
			{@const { slice, share } = arcs[hoveredIndex]}
			{@const tipText = `${slice.label}: ${formatValue(slice.value)} (${(share * 100).toFixed(0)}%)`}
			{@const tipW = Math.max(60, tipText.length * 6)}
			<rect x={CX - tipW / 2} y={4} width={tipW} height={22} rx={4} class="tooltip-bg" />
			<text x={CX} y={19} class="tooltip-text" text-anchor="middle">{tipText}</text>
		{/if}
	</svg>

	{#if slices.length > 1}
		<ul class="legend">
			{#each slices as slice, i (slice.label)}
				<li
					class:hovered={hoveredIndex === i}
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
				>
					<span class="swatch" style="background: var(--{slice.colour});"></span>
					<span class="legend-label">{slice.label}</span>
					<span class="legend-value">{formatValue(slice.value)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.pie-wrap {
		display: flex;
		align-items: center;
		gap: 1.5em;
		flex-wrap: wrap;
	}

	.chart {
		width: 200px;
		height: 200px;
		flex-shrink: 0;
		overflow: visible;
	}

	.slice {
		cursor: pointer;
	}

	.slice-label {
		font-size: 11px;
		font-weight: 700;
		pointer-events: none;
	}

	.center-value {
		font-size: 20px;
		font-weight: 700;
		fill: var(--background_text);
	}

	.center-label {
		font-size: 10px;
		fill: var(--grey);
	}

	.tooltip-bg {
		fill: var(--black);
		opacity: 0.85;
	}

	.tooltip-text {
		font-size: 12px;
		font-weight: 600;
		fill: var(--white);
	}

	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		font-size: 0.85em;
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		cursor: pointer;
		border-radius: 0.2em;
		padding: 0.1em 0.3em;
	}

	.legend li.hovered {
		background: var(--grey_light);
	}

	.swatch {
		width: 0.8em;
		height: 0.8em;
		border-radius: 0.15em;
		flex-shrink: 0;
	}

	.legend-label {
		flex: 1;
	}

	.legend-value {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
</style>
