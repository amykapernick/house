<script lang="ts">
	export type LineChartPoint = {
		/** X axis value — ISO date string or any string label */
		x: string;
		/** Y axis value */
		y: number;
		/** Tooltip override. Defaults to `y` formatted with the line's unit/decimals */
		tooltip?: string;
	};

	export type LineChartLine = {
		/** Data points for this line */
		data: LineChartPoint[];
		/** CSS colour variable name without `var()`. Default: `'blue'` */
		colour?: string;
		/** Unit appended to axis labels and default tooltip. Default: `''` */
		unit?: string;
		/** Decimal places on axis labels and tooltip. Default: `1` */
		decimals?: number;
		/** Which Y axis to plot against. Default: `'left'` */
		axis?: 'left' | 'right';
		/** Line style. Default: `'solid'` */
		style?: 'solid' | 'dashed';
		/** Stroke width in SVG units. Default: `2.5` for solid, `1.5` for dashed */
		weight?: number;
	};

	type Props = {
		lines: LineChartLine[];
		/** Format function for X axis tick labels */
		formatX?: (x: string) => string;
		class?: string;
	};

	const { lines, formatX = (x) => x, class: className = '' }: Props = $props();

	const W = 560;
	const H = 220;
	const PAD_LEFT = 48;
	const PAD_TOP = 16;
	const PAD_BOTTOM = 56;

	const leftLines = $derived(lines.filter(l => (l.axis ?? 'left') === 'left'));
	const rightLines = $derived(lines.filter(l => l.axis === 'right'));
	const hasRightAxis = $derived(rightLines.length > 0);

	const PAD_RIGHT = $derived(hasRightAxis ? 56 : 16);
	const innerW = $derived(W - PAD_LEFT - PAD_RIGHT);
	const innerH = H - PAD_TOP - PAD_BOTTOM;
	const xAxisY = PAD_TOP + innerH;

	// Merged, sorted X values across all lines
	const allX = $derived(
		[...new Set(lines.flatMap(l => l.data.map(p => p.x)))].sort()
	);
	function xPos(xVal: string) {
		const i = allX.indexOf(xVal);
		if (allX.length < 2) return PAD_LEFT + innerW / 2;
		return PAD_LEFT + (i / (allX.length - 1)) * innerW;
	}

	// Left Y axis scale (shared across all left lines)
	const leftValues = $derived(leftLines.flatMap(l => l.data.map(p => p.y)));
	const minLeftY = $derived(leftValues.length ? Math.max(0, Math.min(...leftValues) - Math.abs(Math.min(...leftValues) * 0.05)) : 0);
	const maxLeftY = $derived(leftValues.length ? Math.max(...leftValues) + Math.abs(Math.max(...leftValues) * 0.05) : 1);
	const leftTicks = $derived(Array.from({ length: 5 }, (_, i) => minLeftY + (i / 4) * (maxLeftY - minLeftY)));

	// Right Y axis scale (shared across all right lines)
	const rightValues = $derived(rightLines.flatMap(l => l.data.map(p => p.y)));
	const minRightY = $derived(rightValues.length ? Math.max(0, Math.min(...rightValues) - 5) : 0);
	const maxRightY = $derived(rightValues.length ? Math.min(100, Math.max(...rightValues) + 5) : 100);
	const rightTicks = $derived(Array.from({ length: 5 }, (_, i) => minRightY + (i / 4) * (maxRightY - minRightY)));

	function yPos(v: number, axis: 'left' | 'right' = 'left') {
		const [min, max] = axis === 'right' ? [minRightY, maxRightY] : [minLeftY, maxLeftY];
		return PAD_TOP + (1 - (v - min) / (max - min)) * innerH;
	}

	function polylinePoints(line: LineChartLine) {
		const axis = line.axis ?? 'left';
		return line.data.map(p => `${xPos(p.x)},${yPos(p.y, axis)}`).join(' ');
	}

	function lineStyle(line: LineChartLine) {
		const w = line.weight ?? (line.style === 'dashed' ? 1.5 : 2.5);
		const dash = line.style === 'dashed' ? 'stroke-dasharray: 5 3;' : '';
		return `stroke: var(--${line.colour ?? 'blue'}); stroke-width: ${w}; ${dash}`;
	}

	function dotFill(line: LineChartLine) {
		return `fill: var(--${line.colour ?? 'blue'})`;
	}

	// X axis labels
	const labelStep = $derived(Math.max(1, Math.ceil(allX.length / 8)));
	function showXLabel(i: number) {
		return i % labelStep === 0 || i === allX.length - 1;
	}

	let hoveredX = $state<string | null>(null);
</script>

<div class="chart-wrap {className}">
	<svg viewBox="0 0 {W} {H}" class="chart">
		<!-- Y axis left -->
		<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={xAxisY} class="axis" />
		<!-- X axis -->
		<line x1={PAD_LEFT} y1={xAxisY} x2={PAD_LEFT + innerW} y2={xAxisY} class="axis" />
		<!-- Y axis right -->
		{#if hasRightAxis}
			<line x1={PAD_LEFT + innerW} y1={PAD_TOP} x2={PAD_LEFT + innerW} y2={xAxisY} class="axis axis--right" />
		{/if}

		<!-- Left Y ticks + gridlines -->
		{#each leftTicks as tick}
			{@const y = yPos(tick, 'left')}
			{@const unit = leftLines[0]?.unit ?? ''}
			{@const dec = leftLines[0]?.decimals ?? 1}
			<line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + innerW} y2={y} class="gridline" />
			<text x={PAD_LEFT - 6} {y} class="tick-label" text-anchor="end" dominant-baseline="middle">
				{tick.toFixed(dec)}{unit}
			</text>
		{/each}

		<!-- Right Y ticks -->
		{#if hasRightAxis}
			{@const unit = rightLines[0]?.unit ?? ''}
			{@const dec = rightLines[0]?.decimals ?? 0}
			{#each rightTicks as tick}
				{@const y = yPos(tick, 'right')}
				<text x={PAD_LEFT + innerW + 6} {y} class="tick-label tick-label--right" text-anchor="start" dominant-baseline="middle">
					{tick.toFixed(dec)}{unit}
				</text>
			{/each}
		{/if}

		<!-- Lines -->
		{#each lines as line}
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
		{#each lines as line}
			{@const axis = line.axis ?? 'left'}
			{@const dec = line.decimals ?? 1}
			{@const unit = line.unit ?? ''}
			{#each line.data as point}
				{@const x = xPos(point.x)}
				{@const y = yPos(point.y, axis)}
				<circle
					cx={x} cy={y}
					r={hoveredX === point.x ? 6 : 4}
					style={dotFill(line)}
					class="dot"
					role="img"
					aria-label="{point.x}: {point.tooltip ?? `${point.y.toFixed(dec)}${unit}`}"
					onmouseenter={() => hoveredX = point.x}
					onmouseleave={() => hoveredX = null}
				/>
			{/each}
		{/each}

		<!-- X axis labels -->
		{#each allX as xVal, i}
			{#if showXLabel(i) || hoveredX === xVal}
				{@const x = xPos(xVal)}
				<text
					x={x} y={xAxisY + 12}
					class="tick-label"
					text-anchor="end"
					transform="rotate(-40, {x}, {xAxisY + 12})"
				>
					{formatX(xVal)}
				</text>
			{/if}
		{/each}

		<!-- Tooltip -->
		{#if hoveredX !== null}
			{@const x = xPos(hoveredX)}
			{@const tipLines = lines.map(l => {
				const p = l.data.find(d => d.x === hoveredX);
				if (!p) return null;
				return p.tooltip ?? `${p.y.toFixed(l.decimals ?? 1)}${l.unit ?? ''}`;
			}).filter(Boolean)}
			{@const tipText = tipLines.join(' · ')}
			{@const tipW = Math.max(80, tipText.length * 7.5)}
			{@const firstY = (() => { const l = lines.find(ln => ln.data.some(p => p.x === hoveredX)); const p = l?.data.find(p => p.x === hoveredX); return p ? yPos(p.y, l?.axis ?? 'left') : PAD_TOP; })()}
			<rect x={x - tipW / 2} y={firstY - 36} width={tipW} height={26} rx={4} class="tooltip-bg" />
			<text x={x} y={firstY - 18} class="tooltip-text" text-anchor="middle">{tipText}</text>
		{/if}
	</svg>
</div>

<style>
	.chart-wrap {
		width: 100%;
	}

	.chart {
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.axis {
		stroke: var(--grey);
		stroke-width: 1.5;
	}

	.axis--right {
		opacity: 0.5;
	}

	.gridline {
		stroke: var(--grey_light);
		stroke-width: 1;
		stroke-dasharray: 4 4;
	}

	.dot {
		cursor: pointer;
		transition: r 0.1s ease;
	}

	.tick-label {
		font-size: 11px;
		fill: var(--grey);
	}

	.tick-label--right {
		opacity: 0.7;
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
</style>
