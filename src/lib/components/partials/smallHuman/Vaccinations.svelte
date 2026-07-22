<script lang="ts">
	import type { Vaccinations } from '$types/smallHuman';
	import Card from '$parts/Card.svelte';
	import Icon from '$parts/Icon.svelte';
	import Pill from '$parts/Pill.svelte';

	const {
		vaccinations,
		class: className = '',
	}: {
		vaccinations: Vaccinations;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<p>{vaccinations.note}</p>
	<div class="vaccinations">
		{#each vaccinations.items as v (v.id)}
			<Card>
				<h3>{v.title}</h3>
				<!-- TODO: Add due or given date -->
				<Icon
					colour={true}
					name={v.todoist_task ? 'calendar' : 'vaccine'}
				/>
				<p class="detail">{v.detail}</p>
				<!-- TODO: Allow changing status of vaccination with statusselect component -->
				<Pill
					status={v.status}
					class="status">{v.status}</Pill
				>
			</Card>
		{/each}
	</div>
</div>

<style>
	.vaccinations {
		width: auto;
		max-width: max-content;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.8em;
		background: var(--white_true);

		& h3 {
			grid-area: title;
			margin: 0;
			color: var(--black);
			font-size: 1em;
			font-weight: 700;
		}

		& .detail {
			grid-area: desc;
			margin: 0;
		}

		& :global(.card) {
			grid-template-areas: 'icon title status' 'icon date status' '. desc .';
			grid-template-columns: auto 1fr auto;
			grid-template-rows: auto auto 1fr;
			padding: 1em;
			border: none;
			border-radius: 0;
			background: none;
		}

		& :global(.card:not(:last-child)) {
			border-bottom: 1px solid color-mix(in oklch, var(--background) 92%, var(--black));
		}

		& :global(.icon) {
			grid-area: icon;
			font-size: 2em;
		}

		& :global(.icon svg) {
			width: 1em;
			height: 1em;
			margin-right: 0.5em;
		}
	}
</style>
