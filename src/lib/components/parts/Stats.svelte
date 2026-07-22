<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Component } from 'svelte';
	import Tooltip from './Tooltip.svelte';
	import Info from '$img/icons/c-info-fill.svg?component';

	const {
		items,
		colour,
		class: className = '',
	}: {
		items: {
			name: string;
			value: string;
			colour?: Colour;
			Icon?: Component;
			note?: string;
		}[];
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<dl
	class={className}
	style="

--colour: var(--{colour || 'blue'})"
>
	{#each items as { name, value, colour, Icon, note } (name)}
		<div
			style="

--colour: var(--{colour})"
		>
			<dt>{name}</dt>
			<dd>{value}</dd>
			{#if Icon}<Icon />{/if}
			{#if note}
				<Tooltip label={note}>
					<Info />
				</Tooltip>
			{/if}
		</div>
	{/each}
</dl>

<style>
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, max-content));
		column-gap: 1em;
		color: var(--text_secondary);
		font-size: 0.75em;
		font-weight: 700;

		&:has(:global(svg)) {
			& div {
				grid-row: span 3;
				align-items: center;
			}

			& dt {
				grid-row: 3;
				order: 2;
				color: var(--text_secondary);
				font-weight: 400;
			}
		}
	}

	div {
		display: grid;
		position: relative;
		grid-row: span 2;
		grid-template-rows: subgrid;
		justify-content: center;
		width: auto;
		max-width: max-content;
		margin-bottom: 1em;
		padding: 1em 2em;
		border: 1px solid var(--border);
		border-radius: 0.8em;
		background: light-dark(var(--white_true), color-mix(in oklch, var(--dark_background) 85%, var(--white)));
		text-align: center;
		justify-items: center;

		& > :global(svg) {
			order: -1;
			width: 4em;
			height: 4em;
			margin-bottom: 0.5em;
			padding: 0.7em;
			border-radius: 50%;
			background: var(--background);
		}

		& :global(.tooltip-trigger) {
			position: absolute;
			top: 1em;
			right: 1em;
			color: var(--navy);

			& :global(svg) {
				width: 1em;
				height: 1em;
			}
		}
	}

	dd {
		margin: 0;
		color: var(--navy);
		font-size: 1.5em;
	}
</style>
