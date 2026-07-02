<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Snippet } from "svelte";


	const { title, heading = 3, children, colour }: {
		title: string;
		heading?: 1 | 2 | 3 | 4 | 5 | 6;
		children: Snippet;
		colour?: Colour
	} = $props();
</script>

<div
	style="--colour: var(--{colour || 'blue'})"
>
	<h3>{title}</h3>
	{@render children()}
</div>

<style>
	div {
		border-radius: 1em;
		border: 2px solid var(--colour);
		width: auto;
		padding: 0.5em 0.75em;
		color: var(--colour);
		background: color-mix(in srgb, var(--colour) 10%, white);
	}

	h3 {
		color: var(--colour);
		display: block;
		margin: 0 0 0.2em;
		padding: 0 0.2em;
	}
</style>
