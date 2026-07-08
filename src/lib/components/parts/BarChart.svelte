<script lang="ts">
	import type { Colour } from '$types/global';

	export type BarChartBar = {
		name: string;
		colour: Colour;
		value: number;
		flag?: boolean;
		flagLabel?: string;
	};

	export type BarChartGroup = {
		label: string;
		bars: BarChartBar[];
	};

	type Props = {
		groups: BarChartGroup[];
		unit?: string;
		formatValue?: (v: number) => string;
		orientation?: 'vertical' | 'horizontal';
		class?: string;
	};

	const {
		groups,
		unit = '',
		formatValue = (v) => `${v.toFixed(0)}${unit}`,
		orientation = 'vertical',
		class: className = '',
	}: Props = $props();

	const W = 560;
	const PAD_TOP = 16;
	const PAD_RIGHT = 10;
	const H = $derived(orientation === 'vertical' ? 280 : Math.max(200, 44 * groups.length + 40));
	const PAD_LEFT = $derived(orientation === 'vertical' ? 46 : 110);
	const PAD_BOTTOM = $derived(orientation === 'vertical' ? 70 : 30);
	const innerW = $derived(W - PAD_LEFT - PAD_RIGHT);
	const innerH = $derived(H - PAD_TOP - PAD_BOTTOM);
	const baselineY = $derived(PAD_TOP + innerH);

	const maxBars = $derived(Math.max(1, ...groups.map((g) => g.bars.length)));
	const maxValue = $derived(Math.max(1, ...groups.flatMap((g) => g.bars.map((b) => b.value))) * 1.05);

	const seriesNames = $derived([...new Map(groups.flatMap((g) => g.bars.map((b) => [b.name, b.colour] as const))).entries()]);

	const BAR_GAP = 3;
	const GROUP_PADDING_RATIO = 0.15;

	const slotSize = $derived((orientation === 'vertical' ? innerW : innerH) / Math.max(1, groups.length));
	const groupPadding = $derived(slotSize * GROUP_PADDING_RATIO);
	const barThickness = $derived(Math.max(2, (slotSize - groupPadding * 2 - BAR_GAP * (maxBars - 1)) / maxBars));

	const RADIUS = 4;

	function roundedTopRect(x: number, y: number, w: number, h: number): string {
		const r = Math.min(RADIUS, w / 2, h);
		if (h <= 0 || w <= 0) return '';
		return [
			`M ${x} ${y + h}`,
			`L ${x} ${y + r}`,
			`Q ${x} ${y} ${x + r} ${y}`,
			`L ${x + w - r} ${y}`,
			`Q ${x + w} ${y} ${x + w} ${y + r}`,
			`L ${x + w} ${y + h}`,
			`Z`,
		].join(' ');
	}

	function roundedRightRect(x: number, y: number, w: number, h: number): string {
		const r = Math.min(RADIUS, h / 2, w);
		if (h <= 0 || w <= 0) return '';
		return [
			`M ${x} ${y}`,
			`L ${x + w - r} ${y}`,
			`Q ${x + w} ${y} ${x + w} ${y + r}`,
			`L ${x + w} ${y + h - r}`,
			`Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
			`L ${x} ${y + h}`,
			`Z`,
		].join(' ');
	}

	const valueTicks = $derived(Array.from({ length: 5 }, (_, i) => (i / 4) * maxValue));

	let hoveredKey = $state<string | null>(null);
</script>

<div class="chart-wrap {className}">
	<svg viewBox="0 0 {W} {H}" class="chart">
		{#if orientation === 'vertical'}
			<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={baselineY} class="axis" />
			<line x1={PAD_LEFT} y1={baselineY} x2={PAD_LEFT + innerW} y2={baselineY} class="axis" />
			{#each valueTicks as tick, i (i)}
				{@const y = baselineY - (tick / maxValue) * innerH}
				<line x1={PAD_LEFT} y1={y} x2={PAD_LEFT + innerW} y2={y} class="gridline" />
				<text x={PAD_LEFT - 6} {y} class="tick-label" text-anchor="end" dominant-baseline="middle">{formatValue(tick)}</text>
			{/each}
		{:else}
			<line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + innerH} class="axis" />
			<line x1={PAD_LEFT} y1={PAD_TOP + innerH} x2={PAD_LEFT + innerW} y2={PAD_TOP + innerH} class="axis" />
			{#each valueTicks as tick, i (i)}
				{@const x = PAD_LEFT + (tick / maxValue) * innerW}
				<line x1={x} y1={PAD_TOP} x2={x} y2={PAD_TOP + innerH} class="gridline" />
				<text x={x} y={PAD_TOP + innerH + 14} class="tick-label" text-anchor="middle">{formatValue(tick)}</text>
			{/each}
		{/if}

		{#each groups as group, gi (group.label)}
			{#if orientation === 'vertical'}
				{@const slotX = PAD_LEFT + gi * slotSize}
				<text
					x={slotX + slotSize / 2} y={baselineY + 10}
					class="tick-label" text-anchor="end"
					transform="rotate(-40, {slotX + slotSize / 2}, {baselineY + 10})"
				>
					{group.label}
				</text>
				{#each group.bars as bar, bi (bar.name)}
					{@const x = slotX + groupPadding + bi * (barThickness + BAR_GAP)}
					{@const h = (bar.value / maxValue) * innerH}
					{@const y = baselineY - h}
					{@const key = `${gi}-${bi}`}
					<path
						d={roundedTopRect(x, y, barThickness, h)}
						style="fill: var(--{bar.colour}); {bar.flag ? 'stroke: var(--error); stroke-width: 2px;' : ''}"
						class="bar"
						role="img"
						aria-label="{group.label} - {bar.name}: {formatValue(bar.value)}{bar.flag ? ` (${bar.flagLabel ?? 'over budget'})` : ''}"
						onmouseenter={() => (hoveredKey = key)}
						onmouseleave={() => (hoveredKey = null)}
					/>
					{#if hoveredKey === key}
						{@const tipText = `${group.label} · ${bar.name}: ${formatValue(bar.value)}${bar.flag ? ` (${bar.flagLabel ?? 'over budget'})` : ''}`}
						{@const tipW = Math.max(70, tipText.length * 6)}
						{@const cx = Math.min(Math.max(x + barThickness / 2, PAD_LEFT + tipW / 2), PAD_LEFT + innerW - tipW / 2)}
						<rect x={cx - tipW / 2} y={y - 28} width={tipW} height={22} rx={4} class="tooltip-bg" />
						<text x={cx} y={y - 13} class="tooltip-text" text-anchor="middle">{tipText}</text>
					{/if}
				{/each}
			{:else}
				{@const slotY = PAD_TOP + gi * slotSize}
				<text x={PAD_LEFT - 8} y={slotY + slotSize / 2} class="tick-label" text-anchor="end" dominant-baseline="middle">
					{group.label}
				</text>
				{#each group.bars as bar, bi (bar.name)}
					{@const y = slotY + groupPadding + bi * (barThickness + BAR_GAP)}
					{@const w = (bar.value / maxValue) * innerW}
					{@const key = `${gi}-${bi}`}
					<path
						d={roundedRightRect(PAD_LEFT, y, w, barThickness)}
						style="fill: var(--{bar.colour}); {bar.flag ? 'stroke: var(--error); stroke-width: 2px;' : ''}"
						class="bar"
						role="img"
						aria-label="{group.label} - {bar.name}: {formatValue(bar.value)}{bar.flag ? ` (${bar.flagLabel ?? 'over budget'})` : ''}"
						onmouseenter={() => (hoveredKey = key)}
						onmouseleave={() => (hoveredKey = null)}
					/>
					{#if hoveredKey === key}
						{@const tipText = `${group.label} · ${bar.name}: ${formatValue(bar.value)}${bar.flag ? ` (${bar.flagLabel ?? 'over budget'})` : ''}`}
						{@const tipW = Math.max(70, tipText.length * 6)}
						<rect x={PAD_LEFT + w + 6} y={y + barThickness / 2 - 11} width={tipW} height={22} rx={4} class="tooltip-bg" />
						<text x={PAD_LEFT + w + 6 + tipW / 2} y={y + barThickness / 2 + 4} class="tooltip-text" text-anchor="middle">{tipText}</text>
					{/if}
				{/each}
			{/if}
		{/each}
	</svg>

	{#if seriesNames.length > 1}
		<ul class="legend">
			{#each seriesNames as [name, colour] (name)}
				<li>
					<span class="swatch" style="background: var(--{colour});"></span>
					<span>{name}</span>
				</li>
			{/each}
		</ul>
	{/if}
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

	.gridline {
		stroke: var(--grey_light);
		stroke-width: 1;
		stroke-dasharray: 4 4;
	}

	.tick-label {
		font-size: 11px;
		fill: var(--grey);
	}

	.bar {
		cursor: pointer;
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
		margin: 0.5em 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em 1em;
		font-size: 0.85em;
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.swatch {
		width: 0.8em;
		height: 0.8em;
		border-radius: 0.15em;
		flex-shrink: 0;
	}
</style>
