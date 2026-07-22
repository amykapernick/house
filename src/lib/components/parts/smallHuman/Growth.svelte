<script lang="ts">
	import type { Growth } from '$types/smallHuman';
	import { parseISO, format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import Chart from '$components/parts/graph/Chart.svelte';
	import type { LineChartLine } from '$components/parts/graph/LineChart.svelte';

	const { growth, class: className = '' }: { growth: Growth; class?: string } = $props();

	const sorted = $derived([...growth.measurements].sort((a, b) => a.date.localeCompare(b.date)));

	const percentileLine = (data: { x: Date; y: number; tooltip: string }[]): LineChartLine => ({
		data,
		style: { colour: 'grey', weight: 1.5, style: 'dashed' },
		unit: 'Percentile',
		decimals: 0,
		axis: 'right',
	});

	const measurementLines = (key: 'weight' | 'height' | 'head', colour: string, decimals: number): LineChartLine[] => [
		{
			data: sorted.filter((m) => m[key]?.value != null).map((m) => ({ x: parseISO(m.date), y: m[key]!.value! })),
			style: { colour },
			unit: sorted.find((m) => m[key]?.unit)?.[key]?.unit ?? '',
			decimals,
		},
		percentileLine(sorted.filter((m) => m[key]?.percentile != null).map((m) => ({ x: parseISO(m.date), y: m[key]!.percentile!, tooltip: `${m[key]!.percentile}%` }))),
	];

	const weightLines = $derived(measurementLines('weight', 'green', 1));
	const heightLines = $derived(measurementLines('height', 'blue', 0));
	const headLines = $derived(measurementLines('head', 'purple', 0));

	const formatX = (x: Date) => format(x, DATE_FORMATS.short);
</script>

<div class={className}>
	<p class="trend">{growth.trend_notes}</p>

	<Chart
		type="line"
		lines={weightLines}
		{formatX}
		leftLabel={weightLines[0]?.unit}
		rightLabel={weightLines[1]?.unit}
		caption="Weight"
	/>

	<Chart
		type="line"
		lines={heightLines}
		{formatX}
		leftLabel={heightLines[0]?.unit}
		rightLabel={heightLines[1]?.unit}
		caption="Height"
	/>

	<Chart
		type="line"
		lines={headLines}
		{formatX}
		leftLabel={headLines[0]?.unit}
		rightLabel={headLines[1]?.unit}
		caption="Head Circumference"
	/>
</div>

<style>
	.trend {
		opacity: 0.7;
		font-size: 0.9rem;
		font-style: italic;
	}
</style>
