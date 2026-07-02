<script lang="ts">
	import TeethGraphic from '$lib/img/smallHuman/teeth.svg';
	import type { Teeth } from '$types/smallHuman';
	import Pill from '../Pill.svelte';
	import Stats from '../Stats.svelte';

	const { teeth }: { teeth: Teeth } = $props();
	const upcoming = $derived(teeth.teeth.filter(t => t.status === 'erupting'));
	const existing = $derived(teeth.teeth.filter(t => t.status === 'erupted'));
	const upcomingCss = $derived(upcoming.map(t => `
		svg .t_${t.fdi} { 
			--tooth: color-mix(var(--blue_light) 10%, var(--white)); 
			opacity: 0.5;
		}`).join('\n'));
	const existingCss = $derived(existing.map(t => `
		svg .t_${t.fdi} { 
			--tooth: var(--white); 
			opacity: 1;
		}`).join('\n'));
	const toothDetailsStyle = $derived(teeth.teeth.map(t => `
		.teeth:has(svg .t_${t.fdi}:is(:hover, :focus, :focus-within)) ~ .teeth_details .t_${t.fdi} {
			visibility: visible;
		}`).join('\n'))

	const upcomingStyleBlock = $derived(`<${'style'}>${upcomingCss} ${existingCss} ${toothDetailsStyle}</${'style'}>`);
</script>

<svelte:head>
	{@html upcomingStyleBlock}
</svelte:head>

<section>
	<h2>Teeth</h2>
	<figure class="teeth">
		<TeethGraphic />
		<figcaption>{teeth.note}</figcaption>
	</figure>
	{#if teeth.teething_now}
		<Pill colour="orange">Currently Teething</Pill>
	{/if}
	<Stats items={[
		{ name: 'Erupted', value: existing.length.toString() },
		{ name: 'Upcoming', value: upcoming.length.toString() },
		{ name: 'Remaining', value: (20 - existing.length).toString() }
	]} />
	<p>{teeth.teething_note}</p>
	<div class="teeth_details">
		{#each teeth.teeth as tooth}
			<p class={`t_${tooth.fdi}`}>
				<span class="name">{tooth.fdi}: {tooth.name} - </span>
				{#if tooth.erupted_date}
					<span>Erupted at {tooth.erupted_age_months} months</span>
				{:else}
					<span>Expected at {tooth.typical_eruption_months} months</span>
				{/if}
			</p>
		{/each}
	</div>
	<h3>Upcoming Teeth</h3>
	<dl>
		{#each upcoming as tooth}
			<dt>{tooth.name}</dt>
			<dd>Expected at {tooth.typical_eruption_months} months</dd>
		{/each}
	</dl>
</section>

<style>
	section {
		clear: both;
		overflow: hidden;
	}

	.teeth {
		--tooth: var(--background);
		
		max-height: 70vh;
		max-width: 400px;
		float: right;
		background: var(--background);
		padding: 1em;
		border: 2px solid var(--navy);
	}

	.teeth_details {
		display: grid;
		grid-template-areas: 'details';
		align-items: start;
		justify-items: start;

		& p {
			visibility: hidden;
			grid-area: details;
			background: color-mix(in srgb, var(--navy) 10%, white);
			padding: 0.2em 0.5em;
			border: 2px solid var(--navy);
			border-radius: 0.4em;
			color: var(--navy);
		}
		
		& span {
			margin-left: 1em;
			display: block;
		}

		.name {
			font-weight: 600;
			margin-left: 0;
		}
	}

	:global(svg *[class*='t_']) {
		opacity: 0.2;
		cursor: pointer;

		&:hover, &:focus, &:focus-within {
			opacity: 1;
		}
	}

	figcaption {
		font-size: 0.7em;
		text-align: right;
	}
</style>
