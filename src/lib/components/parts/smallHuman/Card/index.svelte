<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Snippet } from 'svelte';
	import Card from '$parts/Card/index.svelte';
	import styles from './index.module.css';

	const {
		title,
		heading = 3,
		children,
		order = 0,
		onDismiss,
		class: className = '',
	}: {
		title: string;
		heading?: 2 | 3 | 4 | 5 | 6;
		children?: Snippet;
		colour?: Colour;
		order?: number;
		onDismiss?: () => void;
		class?: string;
	} = $props();
</script>

<Card
	class="card {className} {onDismiss ? 'has-dismiss' : ''}"
	style="

--order: {order}"
>
	{#if onDismiss}
		<button
			type="button"
			class={styles.dismiss}
			onclick={onDismiss}
			aria-label="Dismiss {title}">&times;</button
		>
	{/if}
	<svelte:element
		this={`h${heading}`}
		class={styles.heading}>{title}</svelte:element
	>
	{#if children}
		<div class={styles.content}>{@render children()}</div>
	{/if}
</Card>
