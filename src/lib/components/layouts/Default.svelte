<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, wide = false, full = false, class: className = '' }: { children: Snippet; wide?: boolean; full?: boolean; class?: string } = $props();
</script>

<div
	class="layout {className}"
	class:wide
	class:full
>
	{@render children()}
</div>

<style>
	.layout {
		display: grid;
		width: 90vw;
		max-width: min(100vw, 1200px);
		margin: 0 auto 5em;
		padding: 5em 5vw 4em;
		overflow-x: hidden;

		&.wide {
			max-width: 1800px;
		}

		&.full {
			max-width: unset;
		}

		& :global(> h1) {
			grid-column: 1;
			grid-row: 1;
			padding-right: 100px;
		}

		@media (width >= 40em) {
			&.wide,
			&.full {
				padding-right: 0;
				padding-left: 0;
			}
		}

		@media (width >= 45em) {
			padding-top: 7em;
		}

		@media (width >= 50em) {
			width: 100%;
			padding: 2em 5% 4em;

			&.wide,
			&.full {
				padding-right: 20px;
				padding-left: 20px;
			}
		}

		@media (width >= 60em) {
			&.wide,
			&.full {
				padding-right: 50px;
				padding-left: 50px;
			}
		}
	}
</style>
