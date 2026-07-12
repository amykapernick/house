<script lang="ts">
	import type { Growth } from '$types/smallHuman';
	import { parseISO, format } from 'date-fns';
	import LineChart from '$parts/LineChart.svelte';
	import type { LineChartLine } from '$parts/LineChart.svelte';

	const { growth }: { growth: Growth } = $props();

	const sorted = $derived(
		[...growth.measurements].sort((a, b) => a.date.localeCompare(b.date))
	);

	const percentileLine = (data: { x: Date; y: number; tooltip: string }[]): LineChartLine => ({
		data,
		style: { colour: 'grey', weight: 1.5, style: 'dashed' },
		unit: '%ile',
		decimals: 0,
		axis: 'right',
	});

	const measurementLines = (key: 'weight' | 'height' | 'head', colour: string, decimals: number): LineChartLine[] => [
		{
			data: sorted.filter(m => m[key]?.value != null).map(m => ({ x: parseISO(m.date), y: m[key]!.value! })),
			style: { colour }, unit: sorted.find(m => m[key]?.unit)?.[key]?.unit ?? '', decimals,
		},
		percentileLine(
			sorted.filter(m => m[key]?.percentile != null)
				.map(m => ({ x: parseISO(m.date), y: m[key]!.percentile!, tooltip: `${m[key]!.percentile}th %ile` }))
		),
	];

	const weightLines = $derived(measurementLines('weight', 'green', 1));
	const heightLines = $derived(measurementLines('height', 'blue', 0));
	const headLines = $derived(measurementLines('head', 'purple', 0));

	const formatX = (x: Date) => format(x, 'd MMM');
</script>
	
	<p class="trend">{growth.trend_notes}</p>

	<figure>
		<LineChart lines={weightLines} {formatX} leftLabel={weightLines[0]?.unit} rightLabel={weightLines[1]?.unit} />
		<figcaption>Weight</figcaption>
	</figure>

	<figure>
		<LineChart lines={heightLines} {formatX} leftLabel={heightLines[0]?.unit} rightLabel={heightLines[1]?.unit} />
		<figcaption>Height</figcaption>
	</figure>

	<figure>
		<LineChart lines={headLines} {formatX} leftLabel={headLines[0]?.unit} rightLabel={headLines[1]?.unit} />
		<figcaption>Head Circumference</figcaption>
	</figure>

<style>
	.trend {
		font-size: 0.9rem;
		opacity: 0.7;
		font-style: italic;
	}

	figure {
		width: auto;
		border: 2px solid var(--navy);
		margin-bottom: 2em;
		margin-top: 2em;
	}

	figcaption {
		text-align: right;
		padding: 1em;
		font-style: italic;
	}
</style>
