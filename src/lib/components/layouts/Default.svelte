<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, fullWidth = false, class: className = '' }: { children: Snippet; fullWidth?: boolean; class?: string } = $props();
</script>

<div class="layout {className}" class:full={fullWidth}>
	{@render children()}
</div>

<style>
	.layout {
		width: 90vw;
		max-width: 1200px;
		margin: 0 auto;

		&.full {
			max-width: unset;
		}

		@media(width >= 50em) {
			width: 90%
		}
	}
</style>
