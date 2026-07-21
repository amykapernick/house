<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, fullWidth = false, class: className = '' }: { children: Snippet; fullWidth?: boolean; class?: string } = $props();
</script>

<div
	class="layout {className}"
	class:full={fullWidth}
>
	{@render children()}
</div>

<style>
	.layout {
		display: grid;
		width: 90vw;
		max-width: min(100vw, 1200px);
		margin: 0 auto;
		padding: 5em 5vw 4em;
		overflow-x: hidden;

		&.full {
			max-width: unset;
		}

		& :global(h1) {
			grid-column: 1;
			grid-row: 1;
			padding-right: 100px;
		}

		@media (width >= 50em) {
			width: 100%;
			padding: 2em 5%;
		}
	}
</style>
