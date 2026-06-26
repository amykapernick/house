<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, fullWidth = false }: { children: Snippet; fullWidth?: boolean } = $props();
</script>

<div class="layout" class:full={fullWidth}>
	{@render children()}
</div>

<style>
	.layout {
		width: 90vw;
		max-width: 1200px;
		height: 100%;
		margin: 0 auto 20px;

		&.full {
			max-width: unset;
		}
	}
</style>
