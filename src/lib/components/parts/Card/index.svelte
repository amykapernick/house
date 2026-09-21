<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

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

<div
	class="{styles.card} {className}"
	data-theme={theme}
>
	{@render children()}
</div>
