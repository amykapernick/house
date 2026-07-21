<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Snippet } from 'svelte';

	const {
		children,
		colour = 'light',
		class: className = '',
	}: {
		children?: Snippet;
		colour?: 'light' | 'dark';
		class?: string;
	} = $props();
</script>

<div class="card {className} {colour}">
	{@render children()}
</div>

<style>
	.card {
		position: relative;
		width: auto;
		padding: 0.7em;
		border: 1px solid var(--border);
		border-radius: 0.5em;
		background: light-dark(linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true))), linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)), color-mix(in oklch, var(--dark_background) 90%, var(--white))));

		&.dark {
			border: none;
			background: var(--gradient_navy);
			color: var(--dark_background_text);
		}

		@media (width >= 50em) {
			padding: 1em;
		}
	}
</style>
