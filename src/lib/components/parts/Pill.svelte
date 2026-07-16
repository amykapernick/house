<script lang="ts">
	import type { Snippet } from "svelte";


	const { children, status, outline = false, class: className = '' }: {

		children: Snippet;
		status?: 'error' | 'warning' | 'success' | 'info';
		outline?: boolean;
		class?: string;
	} = $props();
</script>

<div
	class={className}
	class:outline
	style={`--pill_colour: var(--${status ?? 'purple_bright'}); --pill_background: var(--${status ?? 'purple_bright'}_bg)`}
>
	{@render children()}
</div>

<style>
	div {
		border-radius: 2em;
		width: auto;
		padding: 0.5em 1em;
		display: flex;
		justify-content: start;
		max-width: max-content;
		font-weight: 600;
		font-size: 0.8em;
		color: var(--pill_colour);
		background: var(--pill_background);
		font-weight: 700;

		&.outline {
			background: none;
			border: 1px solid currentColor;
			font-weight: 600;
		}
	}
</style>
