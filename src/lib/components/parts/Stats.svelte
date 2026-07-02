<script lang="ts">
	import type { Colour } from "$types/global";


	const { items, colour }: {
		items: {
			name: string;
			value: string;
			colour?: Colour;
		}[]
		colour?: Colour
	} = $props();
</script>

<dl
	style="--colour: var(--{colour || 'blue'})"
>
	{#each items as { name, value, colour }}
		<div style="--colour: var(--{colour})">
			<dt>{name}</dt>
			<dd>{value}</dd>
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
	}

	dd {
		margin: 0;
		font-size: 1.5em;
		order: -1;
		font-weight: 600;
	}
</style>
