<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Snippet } from "svelte";

	const { children, colour = 'light', class: className = '' }: {
		children?: Snippet;
		colour?: 'light' | 'dark';
		class?: string;
	} = $props();
</script>

<div
	class="card {className} {colour}"
>
	{@render children()}
</div>

<style>
	.card {
		position: relative;
		border-radius: 0.5em;
		border: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
		width: auto;
		padding: 0.5em 0.75em;
		background: light-dark(
			linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true))),
			linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)), color-mix(in oklch, var(--dark_background) 90%, var(--white)))
		);

		&.dark {
			background: linear-gradient(155deg, rgb(53, 71, 140), rgb(26, 36, 71));
			border: none;
			color: var(--dark_background_text);
		}
	}     

</style>
