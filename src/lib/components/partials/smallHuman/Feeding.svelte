<script lang="ts">
	import type { Feeding, ValueNote } from '$types/smallHuman';
	import Stats from '$parts/Stats/index.svelte';
	import DebugJson from '$parts/DebugJson/index.svelte';
	import Breasts from '$img/smallHuman/breasts.svg?component';
	import Water from '$img/icons/glass-water.svg?component';
	import Food from '$img/icons/soup.svg?component';
	import Card from '$components/parts/smallHuman/Card/index.svelte';
	import Cards from '$components/parts/Cards/index.svelte';

	const {
		feeding,
		class: className = '',
	}: {
		feeding: Feeding;
		class?: string;
	} = $props();

	function formatValueNote({ value, unit, note }: ValueNote): string {
		if (!value?.length) return note;
		const joined = value.length > 1 ? `${Math.min(...value)}-${Math.max(...value)}` : `${value[0]}`;
		return unit ? `${joined} ${unit}` : joined;
	}
</script>

<div class={className}>
	{#if feeding.current}
		<h3>Current Stage - {feeding.current.title}</h3>
		<Stats
			items={[
				{
					name: 'Breastfeeds',
					value: formatValueNote(feeding.current.breastfeeds),
					Icon: Breasts,
					note: feeding.current.breastfeeds?.note,
				},
				{
					name: 'Solid Meals',
					value: formatValueNote(feeding.current.solid_meals),
					Icon: Food,
					note: feeding.current.solid_meals?.note,
				},
				{
					name: 'Water',
					value: formatValueNote(feeding.current.water),
					Icon: Water,
					note: feeding.current.water?.note,
				},
			]}
		/>
	{/if}
	{#if feeding.upcoming}
		<h3>Upcoming Stage - {feeding.upcoming.title}</h3>
		<Stats
			items={[
				{
					name: 'Breastfeeds',
					value: formatValueNote(feeding.upcoming.breastfeeds),
					Icon: Breasts,
					note: feeding.upcoming.breastfeeds?.note,
				},
				{
					name: 'Solid Meals',
					value: formatValueNote(feeding.upcoming.solid_meals),
					Icon: Food,
					note: feeding.upcoming.solid_meals?.note,
				},
				{
					name: 'Water',
					value: formatValueNote(feeding.upcoming.water),
					Icon: Water,
					note: feeding.upcoming.water?.note,
				},
			]}
		/>
	{/if}
</div>
