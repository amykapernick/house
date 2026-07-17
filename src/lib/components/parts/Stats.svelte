<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Component } from "svelte";


	const { items, colour, class: className = '' }: {
		items: {
			name: string;
			value: string;
			colour?: Colour;
			Icon?: Component
		}[]
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
		<div style="

--colour: var(--{colour})">
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
		flex-wrap: wrap;
		font-size: 0.75em;
	}

	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: auto;
		max-width: max-content;
		margin: 0.2em;
		padding: 0.2em 0.5em;
		border: 1.5px solid var(--colour);
		border-radius: 0.2em;
		color: var(--colour);
		text-align: center;

		:global(svg) {
			order: -1;
			width: auto;
			height: 3em;
		}
	}

	dd {
		margin: 0;
		font-size: 1.5em;
		font-weight: 600;
	}
</style>
