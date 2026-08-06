<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Snippet } from 'svelte';
	import './index.module.css';

	const {
		children,
		theme = 'light',
		class: className = '',
	}: {
		children?: Snippet;
		theme?: 'light' | 'dark' | 'white';
		class?: string;
	} = $props();
</script>

<div class="card {className} {theme}">
	{@render children()}
</div>
