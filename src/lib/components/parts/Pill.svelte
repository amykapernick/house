<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Snippet } from "svelte";


	const { children, colour, class: className = '' }: {

		children: Snippet;
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<div
	class={className}
	style="--colour: var(--{colour || 'blue'})"
>
	{@render children()}
</div>

<style>
	div {
		border-radius: 1em;
		border: 2px solid var(--colour);
		width: auto;
		padding: 0.2em 0.5em;
		display: flex;
		justify-content: start;
		max-width: max-content;
		font-weight: 600;
		color: var(--colour);
	}
</style>
