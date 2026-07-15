<script lang="ts">
	import type { Snippet } from "svelte";

	const { children, class: className = '' }: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class={className}>
	{@render children()}
</div>

<style>
	div {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	@supports(grid-template-areas: '.') {
		div {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			justify-content: stretch;
			justify-items: stretch;
		}
	}

</style>
