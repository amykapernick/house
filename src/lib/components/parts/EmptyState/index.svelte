<script lang="ts">
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		title,
		message,
		children,
		class: className = '',
		page = false,
	}: {
		title: string;
		message?: string;
		children?: Snippet;
		class?: string;
		page?: Boolean;
	} = $props();
</script>

<div class={[styles['empty-state'], className, page && styles.page]}>
	<h2>{title}</h2>
	{#if message}<p>{message}</p>{/if}
	{#if children}
		<div class={styles.actions}>{@render children()}</div>
	{/if}
</div>
