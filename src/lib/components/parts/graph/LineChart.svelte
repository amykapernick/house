<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';

	export type LineChartPoint = {
		x: Date;
		y: number;
		tooltip?: string;
	};

	export type LineChartLine = {
		data: LineChartPoint[];
		style?: {
			colour?: string;
			weight?: number;
			style?: 'solid' | 'dashed';
		};
		unit?: string;
		decimals?: number;
		axis?: 'left' | 'right';
	};

	type Props = {
		lines: LineChartLine[];
		formatX?: (x: Date) => string;
		class?: string;
		xLabel?: string;
		leftLabel?: string;
		rightLabel?: string;
	};

	const { lines, formatX = (x) => format(x, DATE_FORMATS.short), class: className = '', xLabel, leftLabel, rightLabel }: Props = $props();

	const W = 560;
	const H = 220;
	const PAD_TOP = 16;

	const leftLines = $derived(lines.filter((l) => (l.axis ?? 'left') === 'left'));
	const rightLines = $derived(lines.filter((l) => l.axis === 'right'));
	const hasRightAxis = $derived(rightLines.length > 0);

	const PAD_LEFT = $derived(42 + (leftLabel ? 14 : 0));
	const PAD_RIGHT = $derived((hasRightAxis ? 44 : 10) + (rightLabel ? 14 : 0));
	const PAD_BOTTOM = $derived(40 + (xLabel ? 16 : 0));
	const innerW = $derived(W - PAD_LEFT - PAD_RIGHT);
	const innerH = $derived(H - PAD_TOP - PAD_BOTTOM);
	const xAxisY = $derived(PAD_TOP + innerH);

	// Deduplicate Date objects by timestamp, sort chronologically
	const allDates = $derived([...new Map(lines.flatMap((l) => l.data.map((p) => [p.x.getTime(), p.x]))).values()].sort((a, b) => a.getTime() - b.getTime()));
	const minMs = $derived(allDates.length ? allDates[0].getTime() : 0);
	const maxMs = $derived(allDates.length ? allDates[allDates.length - 1].getTime() : 1);
	const rangeDays = $derived((maxMs - minMs) / 86400000);

	function xPos(date: Date): number {
		if (minMs === maxMs) return PAD_LEFT + innerW / 2;
		return PAD_LEFT + ((date.getTime() - minMs) / (maxMs - minMs)) * innerW;
	}

	// Regular interval ticks across the full date range
	/* eslint-disable svelte/prefer-svelte-reactivity -- `d` is a scratch variable mutated via setDate/setMonth
	   during tick generation and discarded; only the plain Date copies pushed to `ticks` escape this function. */
	const xTicks = $derived.by<Date[]>(() => {
		if (allDates.length < 2) return [...allDates];

		const start = allDates[0];
		const end = allDates[allDates.length - 1];
		const ticks: Date[] = [];

		if (rangeDays <= 14) {
			// Daily
			const d = new Date(start);
			while (d <= end) {
				ticks.push(new Date(d));
				d.setDate(d.getDate() + 1);
			}
		} else if (rangeDays <= 60) {
			// Weekly, snapped to Monday
			const d = new Date(start);
			d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
			while (d <= end) {
				if (d.getTime() >= minMs) ticks.push(new Date(d));
				d.setDate(d.getDate() + 7);
			}
		} else if (rangeDays <= 120) {
			// Fortnightly: 1st and 15th of each month
			const d = new Date(start.getFullYear(), start.getMonth(), 1);
			while (d <= end) {
				if (d.getTime() >= minMs) ticks.push(new Date(d));
				if (d.getDate() === 1) d.setDate(15);
				else {
					d.setMonth(d.getMonth() + 1);
					d.setDate(1);
				}
			}
		} else {
			// Monthly: 1st of each month; every 2 months for very long ranges
			const monthStep = rangeDays > 600 ? 2 : 1;
			const d = new Date(start.getFullYear(), start.getMonth(), 1);
			while (d <= end) {
				if (d.getTime() >= minMs) ticks.push(new Date(d));
				d.setMonth(d.getMonth() + monthStep);
			}
		}
		/* eslint-enable svelte/prefer-svelte-reactivity */

		return ticks;
	});

	// Y axes always start at 0
	const leftValues = $derived(leftLines.flatMap((l) => l.data.map((p) => p.y)));
	const maxLeftY = $derived(leftValues.length ? Math.max(...leftValues) * 1.05 : 1);
	const leftTicks = $derived(Array.from({ length: 5 }, (_, i) => (i / 4) * maxLeftY));

	const rightValues = $derived(rightLines.flatMap((l) => l.data.map((p) => p.y)));
	const maxRightY = $derived(rightValues.length ? Math.min(100, Math.max(...rightValues) + 5) : 100);
	const rightTicks = $derived(Array.from({ length: 5 }, (_, i) => (i / 4) * maxRightY));

	function yPos(v: number, axis: 'left' | 'right' = 'left') {
		const max = axis === 'right' ? maxRightY : maxLeftY;
		return PAD_TOP + (1 - v / max) * innerH;
	}

	function polylinePoints(line: LineChartLine) {
		const axis = line.axis ?? 'left';
		return line.data.map((p) => `${xPos(p.x)},${yPos(p.y, axis)}`).join(' ');
	}

	function lineStyle(line: LineChartLine) {
		const colour = line.style?.colour ?? 'green';
		const w = line.style?.weight ?? 2;
		const dash = line.style?.style === 'dashed' ? 'stroke-dasharray: 5 3;' : '';
		return `stroke: var(--${colour}); stroke-width: ${w}; ${dash}`;
	}

	function dotFill(line: LineChartLine) {
		return `fill: var(--${line.style?.colour ?? 'green'})`;
	}

	// Hover tracked by timestamp so Date identity doesn't matter
	let hoveredX = $state<number | null>(null);
	const hoveredTickShown = $derived(hoveredX !== null && xTicks.some((t) => t.getTime() === hoveredX));
</script>

<div class="chart-wrap {className}">
	<svg
		viewBox="0 0 {W} {H}"
		class="chart"
	>
		<!-- Left Y ticks + gridlines -->
		{#each leftTicks as tick, i (i)}
			{@const y = yPos(tick, 'left')}
			{@const dec = leftLines[0]?.decimals ?? 1}
			<line
				x1={PAD_LEFT}
				y1={y}
				x2={PAD_LEFT + innerW}
				y2={y}
				class="gridline"
			/>
			<text
				x={PAD_LEFT - 6}
				{y}
				class="tick-label"
				text-anchor="end"
				dominant-baseline="middle"
			>
				{tick.toFixed(dec)}
			</text>
		{/each}

		<!-- Right Y ticks -->
		{#if hasRightAxis}
			{@const dec = rightLines[0]?.decimals ?? 0}
			{#each rightTicks as tick, i (i)}
				{@const y = yPos(tick, 'right')}
				<text
					x={PAD_LEFT + innerW + 6}
					{y}
					class="tick-label tick-label--right"
					text-anchor="start"
					dominant-baseline="middle"
				>
					{tick.toFixed(dec)}
				</text>
			{/each}
		{/if}

		<!-- Lines -->
		{#each lines as line, i (i)}
			{#if line.data.length > 1}
				<polyline
					points={polylinePoints(line)}
					fill="none"
					stroke-linejoin="round"
					stroke-linecap="round"
					style={lineStyle(line)}
				/>
			{/if}
		{/each}

		<!-- Dots -->
		{#each lines as line, i (i)}
			{@const axis = line.axis ?? 'left'}
			{@const dec = line.decimals ?? 1}
			{@const unit = line.unit ?? ''}
			{#each line.data as point (point.x.getTime())}
				{@const x = xPos(point.x)}
				{@const y = yPos(point.y, axis)}
				<circle
					cx={x}
					cy={y}
					r={hoveredX === point.x.getTime() ? 6 : 4}
					style={dotFill(line)}
					class="dot"
					role="img"
					aria-label="{formatX(point.x)}: {point.tooltip ?? `${point.y.toFixed(dec)}${unit}`}"
					onmouseenter={() => (hoveredX = point.x.getTime())}
					onmouseleave={() => (hoveredX = null)}
				/>
			{/each}
		{/each}

		<!-- Regular X axis ticks + labels -->
		{#each xTicks as tick (tick.getTime())}
			{@const x = xPos(tick)}
			<line
				x1={x}
				y1={xAxisY}
				x2={x}
				y2={xAxisY + 4}
				class="axis-tick"
			/>
			<text
				{x}
				y={xAxisY + 10}
				class="tick-label"
				text-anchor="end"
				transform="rotate(-40, {x}, {xAxisY + 10})"
			>
				{formatX(tick)}
			</text>
		{/each}

		<!-- Hovered date label (only if not already a regular tick) -->
		{#if hoveredX !== null && !hoveredTickShown}
			{@const x = xPos(new Date(hoveredX))}
			<text
				{x}
				y={xAxisY + 10}
				class="tick-label tick-label--hover"
				text-anchor="end"
				transform="rotate(-40, {x}, {xAxisY + 10})"
			>
				{formatX(new Date(hoveredX))}
			</text>
		{/if}

		<!-- Tooltip -->
		{#if hoveredX !== null}
			{@const hovDate = new Date(hoveredX)}
			{@const x = xPos(hovDate)}
			{@const tipLines = lines
				.map((l) => {
					const p = l.data.find((d) => d.x.getTime() === hoveredX);
					if (!p) return null;
					return p.tooltip ?? `${p.y.toFixed(l.decimals ?? 1)}${l.unit ?? ''}`;
				})
				.filter(Boolean)}
			{@const tipText = tipLines.join(' · ')}
			{@const tipW = Math.max(80, tipText.length * 7.5)}
			{@const firstY = (() => {
				const l = lines.find((ln) => ln.data.some((p) => p.x.getTime() === hoveredX));
				const p = l?.data.find((p) => p.x.getTime() === hoveredX);
				return p ? yPos(p.y, l?.axis ?? 'left') : PAD_TOP;
			})()}
			<rect
				x={x - tipW / 2}
				y={firstY - 36}
				width={tipW}
				height={26}
				rx={4}
				class="tooltip-bg"
			/>
			<text
				{x}
				y={firstY - 18}
				class="tooltip-text"
				text-anchor="middle">{tipText}</text
			>
		{/if}

		<!-- Axis labels -->
		{#if leftLabel}
			<text
				x={14}
				y={PAD_TOP + innerH / 2}
				class="axis-label"
				text-anchor="middle"
				transform="rotate(-90, 14, {PAD_TOP + innerH / 2})"
			>
				{leftLabel}
			</text>
		{/if}
		{#if rightLabel}
			<text
				x={W - 14}
				y={PAD_TOP + innerH / 2}
				class="axis-label"
				text-anchor="middle"
				transform="rotate(90, {W - 14}, {PAD_TOP + innerH / 2})"
			>
				{rightLabel}
			</text>
		{/if}
		{#if xLabel}
			<text
				x={PAD_LEFT + innerW / 2}
				y={H - 6}
				class="axis-label"
				text-anchor="middle"
			>
				{xLabel}
			</text>
		{/if}
	</svg>
</div>

<style>
	.chart-wrap {
		width: 100%;
		color: light-dark(color-mix(in oklch, var(--background) 92%, var(--black)), color-mix(in oklch, var(--dark_background) 80%, var(--white)));
		font-size: 0.8em;
	}

	.chart {
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.axis {
		stroke-width: 1.5;
		stroke: currentColor;
	}

	.axis-tick {
		stroke-width: 1;
		stroke: currentColor;
	}

	.axis-label {
		fill: currentColor;
		font-size: 0.6em;
		font-weight: 600;
	}

	.axis-label,
	.tick-label {
		color: light-dark(color-mix(in oklch, var(--grey) 84%, var(--black)), color-mix(in oklch, var(--grey_light) 85%, var(--dark_background)));
	}

	.gridline {
		stroke-width: 0.5;
		stroke-dasharray: none;
		stroke: var(--grey_light);
	}

	.dot {
		transition: r 0.1s ease;
		cursor: pointer;
	}

	.tick-label {
		fill: currentColor;
		font-size: 0.6em;
	}

	.tick-label--hover {
		fill: var(--black);
		font-weight: 600;
	}

	.tooltip-bg {
		opacity: 0.85;
		fill: var(--black);
	}

	.tooltip-text {
		fill: var(--white);
		font-size: 0.6em;
		font-weight: 600;
	}
</style>
