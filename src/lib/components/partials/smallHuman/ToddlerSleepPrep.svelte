<script lang="ts">
	import type { ToddlerSleepPrepDetail, AlertType } from '$types/smallHuman';
	import type { Colour } from '$types/global';
	import Card from '$parts/Card/index.svelte';
	import Pill from '$parts/Pill/index.svelte';

	const {
		toddlerSleepPrep,
		alertColours,
		class: className = '',
	}: {
		toddlerSleepPrep: ToddlerSleepPrepDetail;
		alertColours: Record<AlertType, Colour>;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<p>{toddlerSleepPrep.note}</p>
	{#if toddlerSleepPrep.status === 'due'}
		<Card
			title={toddlerSleepPrep.alert_when_due.title}
			theme={alertColours[toddlerSleepPrep.alert_when_due.level]}
		>
			<p>{toddlerSleepPrep.alert_when_due.detail}</p>
		</Card>
	{:else}
		<Pill colour="blue">Not yet due</Pill>
	{/if}
	<h3>Reading</h3>
	{#each toddlerSleepPrep.reading as i (i.id)}
		<h4>{i.title}</h4>
		<p>{i.note}</p>
	{/each}
</div>
