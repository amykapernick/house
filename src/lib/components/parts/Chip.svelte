<script lang="ts">
	import type { Colour } from '$types/global';
	import Card from './Card.svelte';
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';
	import Tooltip from './Tooltip.svelte';
	import Info from '$img/icons/c-info-fill.svg?component';

	let {
		label,
		value,
		info,
		class: className = '',
	}: {
		label: string;
		value: string;
		info?: string;
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<Card class="chip {className}">
	<h3>{label}</h3>
	<p>{value}</p>
	{#if info}
		<Tooltip label={info}>
			<Info />
		</Tooltip>
	{/if}
</Card>

<style>
	@import '@mixins';

	:global(.chip) {
		position: relative;
		border: var(--border);
		background: var(--white);
		color: var(--black);
		font-weight: 700;

		& :global(.tooltip-trigger) {
			position: absolute;
			right: 0.5em;
			bottom: 0.2em;
			color: var(--navy);

			& :global(svg) {
				width: 1em;
				height: 1em;
			}
		}
	}

	h3 {
		margin: 0;

		@include subtitle;
	}
</style>
