<script lang="ts">
	import type { Snippet } from 'svelte';
	import './index.module.css';

	let { children, wide = false, full = false, class: className = '' }: { children: Snippet; wide?: boolean; full?: boolean; class?: string } = $props();
</script>

<div
	class="layout {className}"
	class:wide
	class:full
>
	{@render children()}
</div>
