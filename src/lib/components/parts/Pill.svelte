<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		children,
		status,
		outline = false,
		class: className = '',
	}: {
		children: Snippet;
		status?: 'error' | 'warning' | 'success' | 'info';
		outline?: boolean;
		class?: string;
	} = $props();

	// TODO: allow adding other statuses and mapping to existing ones, eg. done, in_progress, etc, similar to statusselect lookup
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
		display: flex;
		justify-content: start;
		width: auto;
		max-width: max-content;
		padding: 0.5em 1em;
		border-radius: 2em;
		background: var(--pill_background);
		color: var(--pill_colour);
		font-size: 0.8em;
		font-weight: 700;

		&.outline {
			border: 1px solid currentColor;
			background: none;
			font-weight: 600;
		}
	}
</style>
