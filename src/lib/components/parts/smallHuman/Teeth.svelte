<script lang="ts">
	import TeethGraphic from '$lib/img/smallHuman/teeth.svg?component';
	import type { Teeth, Tooth } from '$types/smallHuman';
	import { formatDate, differenceInMonths, parseISO } from 'date-fns';
	import Pill from '../Pill.svelte';
	import Stats from '../Stats.svelte';
	import Modal from '../Modal.svelte';

	const {
		teeth,
		birth,
		onMarkErupted,
	}: {
		teeth: Teeth;
		birth: string;
		onMarkErupted?: (fdi: number) => void;
	} = $props();

	const upcoming = $derived(teeth.teeth.filter(t => t.status === 'upcoming'));
	const existing = $derived(teeth.teeth.filter(t => t.status === 'erupted'));

	let confirmingTooth = $state<Tooth | null>(null);
	let confirmOpen = $state(false);
	let wrapper: HTMLElement | undefined = $state();

	function toothFromTarget(target: EventTarget | null): Tooth | undefined {
		const el = (target as HTMLElement)?.closest?.('[class*="t_"]');
		const fdi = Number(el?.getAttribute('class')?.match(/t_(\d+)/)?.[1]);
		if (!fdi) return;
		return teeth.teeth.find(t => t.fdi === fdi);
	}

	function tryOpenConfirm(tooth: Tooth | undefined) {
		if (!onMarkErupted || !tooth || tooth.status === 'erupted') return;
		confirmingTooth = tooth;
		confirmOpen = true;
	}

	function handleTeethClick(e: MouseEvent) {
		tryOpenConfirm(toothFromTarget(e.target));
	}

	function handleTeethKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' && e.key !== ' ') return;
		const tooth = toothFromTarget(e.target);
		if (!tooth) return;
		e.preventDefault();
		tryOpenConfirm(tooth);
	}

	// Tooth groups are plain SVG <g> elements - role/aria-label can't be set
	// statically in the source asset per-tooth, so apply them once mounted.
	$effect(() => {
		if (!wrapper) return;
		for (const tooth of teeth.teeth) {
			const el = wrapper.querySelector(`.t_${tooth.fdi}`);
			if (!el) continue;
			el.setAttribute('role', 'button');
			el.setAttribute('aria-label', `${tooth.name}${onMarkErupted && tooth.status !== 'erupted' ? ' - mark as erupted' : ''}`);
		}
	});

	function confirmErupted() {
		if (confirmingTooth) onMarkErupted?.(confirmingTooth.fdi);
		confirmOpen = false;
	}
	const eruptedAgeMonths = (erupted_date: string) => differenceInMonths(parseISO(erupted_date), parseISO(birth));
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
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- content is built entirely from internal numeric FDI values and static CSS, no user input -->
	{@html upcomingStyleBlock}
</svelte:head>

	<!-- Event delegation wrapper - the actual interactive targets (tooth groups) have role="button"/tabindex/keydown handling set individually -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<figure class="teeth" bind:this={wrapper} onclick={handleTeethClick} onkeydown={handleTeethKeydown}>
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
		{#each teeth.teeth as tooth (tooth.fdi)}
			<p class={`t_${tooth.fdi}`}>
				<span class="name">{tooth.fdi}: {tooth.name} - </span>
				{#if tooth.erupted_date}
					<span>Erupted at {eruptedAgeMonths(tooth.erupted_date)} months</span>
				{:else}
					<span>Expected at {tooth.expected_months} months</span>
				{/if}
			</p>
		{/each}
	</div>
	<h3>Upcoming Teeth</h3>
	<dl>
		{#each upcoming as tooth (tooth.fdi)}
			<dt>{tooth.name}</dt>
			<dd>Expected at {tooth.expected_months} months</dd>
		{/each}
	</dl>
	<h3>Dental Care</h3>
	<dl>
		<dt>Toothbrush</dt>
		<dd>{teeth.dental_care.toothbrush}</dd>
		<dt>Toothpaste</dt>
		<dd>{teeth.dental_care.toothpaste}</dd>
		<dt>Next Dentist Appointment</dt>
		<dd>{teeth.dental_care.todoist_task && formatDate(new Date(teeth.dental_care.todoist_task.due), 'dd MMM')}</dd>
	</dl>

<Modal bind:open={confirmOpen} title="Mark tooth as erupted?">
	{#if confirmingTooth}
		<p>Mark <strong>{confirmingTooth.name}</strong> (tooth {confirmingTooth.fdi}) as erupted?</p>
		<div class="confirm_actions">
			<button onclick={confirmErupted}>Confirm</button>
			<button onclick={() => (confirmOpen = false)}>Cancel</button>
		</div>
	{/if}
</Modal>

<style>
	.confirm_actions {
		display: flex;
		gap: 0.5em;
		margin-top: 1em;
	}

	dt {
		font-weight: 700;
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
