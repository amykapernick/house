<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Component } from 'svelte';

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
	{#each items as { name, value, colour, Icon } (name)}
		<div
			style="

--colour: var(--{colour})"
		>
			<dt class={Icon ? 'sr-only' : ''}>{name}</dt>
			<dd>{value}</dd>
			{#if Icon}<Icon />{/if}
		</div>
	{/each}
</dl>

<style>
	dl {
		display: flex;
		flex-wrap: wrap;
		color: var(--text_secondary);
		font-size: 0.75em;
		font-weight: 700;
		gap: 1em;
	}

	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: auto;
		max-width: max-content;
		padding: 1em;
		border: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
		border-radius: 0.8em;
		background: var(--white_true);
		text-align: center;

		& :global(svg) {
			order: -1;
			width: auto;
			height: 3em;
		}
	}

	dd {
		margin: 0;
		color: var(--navy);
		font-size: 1.5em;
	}
</style>
