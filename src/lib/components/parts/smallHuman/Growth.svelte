<script lang="ts">
	import type { Growth } from '$types/smallHuman';
	import { parseISO, format } from 'date-fns';
	import LineChart from '$parts/LineChart.svelte';
	import type { LineChartLine } from '$parts/LineChart.svelte';

	const { growth }: { growth: Growth } = $props();

	const sorted = $derived(
		[...growth.measurements].sort((a, b) => a.date.localeCompare(b.date))
	);

	const percentileLine = (data: { x: string; y: number }[]): LineChartLine => ({
		data,
		colour: 'grey',
		unit: '%',
		decimals: 0,
		axis: 'right',
		style: 'dashed',
		weight: 1,
	});

	const weightLines = $derived<LineChartLine[]>([
		{
			data: sorted.map(m => ({ x: m.date, y: m.weight_kg })),
			colour: 'green', unit: 'kg', decimals: 1,
		},
		percentileLine(
			sorted.filter(m => m.weight_percentile != null)
				.map(m => ({ x: m.date, y: m.weight_percentile!, tooltip: `${m.weight_percentile}th %ile` }))
		),
	]);

	const heightLines = $derived<LineChartLine[]>([
		{
			data: sorted.filter(m => m.height_cm != null).map(m => ({ x: m.date, y: m.height_cm! })),
			colour: 'blue', unit: 'cm', decimals: 0,
		},
		percentileLine(
			sorted.filter(m => m.height_percentile != null)
				.map(m => ({ x: m.date, y: m.height_percentile!, tooltip: `${m.height_percentile}th %ile` }))
		),
	]);

	const headLines = $derived<LineChartLine[]>([
		{
			data: sorted.filter(m => m.head_cm != null).map(m => ({ x: m.date, y: m.head_cm! })),
			colour: 'purple', unit: 'cm', decimals: 0,
		},
		percentileLine(
			sorted.filter(m => m.head_percentile != null)
				.map(m => ({ x: m.date, y: m.head_percentile!, tooltip: `${m.head_percentile}th %ile` }))
		),
	]);

	const formatX = (x: string) => format(parseISO(x), 'd MMM');
</script>

<section>
	<h2>Growth</h2>
	<p class="trend">{growth.trend_notes}</p>

	<figure>
		<LineChart lines={weightLines} {formatX} />
		<figcaption>Weight</figcaption>
	</figure>

	<figure>
		<LineChart lines={heightLines} {formatX} />
		<figcaption>Height</figcaption>
	</figure>

	<figure>
		<LineChart lines={headLines} {formatX} />
		<figcaption>Head Circumference</figcaption>
	</figure>
</section>

<style>
	h2 {
		color: var(--green);
	}

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
