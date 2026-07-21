<script lang="ts">
	import BarChart from './BarChart.svelte';
	import LineChart from './LineChart.svelte';
	import PieChart from './PieChart.svelte';
	import type { BarChartGroup } from './BarChart.svelte';
	import type { LineChartLine } from './LineChart.svelte';
	import type { PieSlice } from './PieChart.svelte';

	type BarProps = {
		type: 'bar';
		groups: BarChartGroup[];
		unit?: string;
		formatValue?: (v: number) => string;
		orientation?: 'vertical' | 'horizontal';
	};

	type LineProps = {
		type: 'line';
		lines: LineChartLine[];
		formatX?: (x: Date) => string;
		xLabel?: string;
		leftLabel?: string;
		rightLabel?: string;
	};

	type PieProps = {
		type: 'pie';
		slices: PieSlice[];
		formatValue?: (v: number) => string;
		centerLabel?: string;
		centerValue?: string;
	};

	type Props = (BarProps | LineProps | PieProps) & {
		caption: string;
		class?: string;
	};

	const props: Props = $props();
	const { caption, class: className = '' } = $derived(props);
</script>

<figure class={className}>
	{#if props.type === 'bar'}
		<BarChart
			groups={props.groups}
			unit={props.unit}
			formatValue={props.formatValue}
			orientation={props.orientation}
		/>
	{:else if props.type === 'line'}
		<LineChart
			lines={props.lines}
			formatX={props.formatX}
			xLabel={props.xLabel}
			leftLabel={props.leftLabel}
			rightLabel={props.rightLabel}
		/>
	{:else if props.type === 'pie'}
		<PieChart
			slices={props.slices}
			formatValue={props.formatValue}
			centerLabel={props.centerLabel}
			centerValue={props.centerValue}
		/>
	{/if}
	<figcaption>{caption}</figcaption>
</figure>
