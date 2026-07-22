<script lang="ts">
	import type { Feeding, ValueNote } from '$types/smallHuman';
	import Stats from '$parts/Stats.svelte';
	import DebugJson from '$parts/DebugJson.svelte';
	import Breasts from '$img/smallHuman/breasts.svg?component';
	import Water from '$img/icons/glass-water.svg?component';
	import Food from '$img/icons/soup.svg?component';
	import Card from '$components/parts/smallHuman/Card.svelte';
	import Cards from '$components/parts/Cards.svelte';

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

	const feedingStage = $derived({
		current: feeding.schedule.stages.find((s) => s.id === feeding.schedule.upcoming?.[0]),
		upcoming: feeding.schedule.stages.find((s) => s.id === feeding.schedule.upcoming?.[1]),
	});
</script>

<div class={className}>
	{#if feedingStage.current}
		<h3>Current Stage - {feedingStage.current.title}</h3>
		<Stats
			items={[
				{
					name: 'Breastfeeds',
					value: formatValueNote(feedingStage.current.breastfeeds),
					Icon: Breasts,
					note: feedingStage.current.breastfeeds?.note,
				},
				{
					name: 'Solid Meals',
					value: formatValueNote(feedingStage.current.solid_meals),
					Icon: Food,
					note: feedingStage.current.solid_meals?.note,
				},
				{
					name: 'Water',
					value: formatValueNote(feedingStage.current.water),
					Icon: Water,
					note: feedingStage.current.water?.note,
				},
			]}
		/>
	{/if}
	{#if feedingStage.upcoming}
		<h3>Upcoming Stage - {feedingStage.upcoming.title}</h3>
		<Stats
			items={[
				{
					name: 'Breastfeeds',
					value: formatValueNote(feedingStage.upcoming.breastfeeds),
					Icon: Breasts,
					note: feedingStage.current.breastfeeds?.note,
				},
				{
					name: 'Solid Meals',
					value: formatValueNote(feedingStage.upcoming.solid_meals),
					Icon: Food,
					note: feedingStage.current.solid_meals?.note,
				},
				{
					name: 'Water',
					value: formatValueNote(feedingStage.upcoming.water),
					Icon: Water,
					note: feedingStage.current.water?.note,
				},
			]}
		/>
	{/if}
	<h3>Details</h3>
	<dl>
		{#each feeding.details as { label, value } (label)}
			<dt>{label}</dt>
			<dd>{value}</dd>
		{/each}
	</dl>
	<h3>Food Principles</h3>
	<p>{feeding.principles.core_philosophy}</p>
	<p>{feeding.principles.note}</p>
	<Cards>
		{#each feeding.principles.current_and_ongoing as item (item.title)}
			<Card title={item.title}>
				<p>{item.detail}</p>
			</Card>
		{/each}
	</Cards>
	<h4>Toddler Forward Look</h4>
	<Cards>
		{#each feeding.principles.toddler_forward_look as item (item.title)}
			<Card title={item.title}>
				<p>{item.detail}</p>
			</Card>
		{/each}
	</Cards>
</div>
