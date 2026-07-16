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
		border: 1px solid color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13));
		width: auto;
		padding: 0.5em 0.75em;
		background: light-dark(
			linear-gradient(rgb(255, 255, 255), color-mix(in oklch, rgb(247, 240, 235) 55%, rgb(255, 255, 255))),
			linear-gradient(color-mix(in oklch, rgb(20, 23, 29) 85%, rgb(245, 240, 240)), color-mix(in oklch, rgb(20, 23, 29) 90%, rgb(245, 240, 240)))
		);

		&.dark {
			background: linear-gradient(155deg, rgb(53, 71, 140), rgb(26, 36, 71));
			border: none;
			color: var(--dark_background_text);
		}
	}     

</style>
