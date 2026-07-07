<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Component } from "svelte";


	const { items, colour }: {
		items: {
			name: string;
			value: string;
			colour?: Colour;
			Icon?: Component
		}[]
		colour?: Colour
	} = $props();
</script>

<dl
	style="--colour: var(--{colour || 'blue'})"
>
	{#each items as { name, value, colour, Icon } (name)}
		<div style="--colour: var(--{colour})">
			<dt class={Icon ? 'sr-only' : ''}>{name}</dt>
			<dd>{value}</dd>
			{#if Icon}<Icon />{/if}
		</div>
	{/each}
</dl>

<style>
	dl {
		--colour: var(--blue);

		display: flex;
		font-size: 0.75em;
		flex-wrap: wrap;
	}

	div {
		border-radius: 0.2em;
		border: 1.5px solid var(--colour);
		width: auto;
		padding: 0.2em 0.5em;
		max-width: max-content;
		color: var(--colour);
		margin: 0.2em;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;

		:global(svg) {
			order: -1;
			height: 3em;
			width: auto;
		}
	}

	dd {
		margin: 0;
		font-size: 1.5em;
		font-weight: 600;
	}
</style>
