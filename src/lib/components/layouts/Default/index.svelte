<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { writable } from 'svelte/store';
	import { TITLE_CONTEXT_KEY, type TitleContext } from '$utils/title';
	import { LAYOUT_WIDTH_CONTEXT_KEY, type LayoutWidthContext } from '$utils/layoutWidth';
	import styles from './index.module.css';

	let { children, width = `normal`, class: className = '' }: { children: Snippet; width?: `normal` | `wide` | `full`; class?: string } = $props();

	const title: TitleContext = writable(undefined);
	setContext(TITLE_CONTEXT_KEY, title);

	const widthOverride: LayoutWidthContext = writable(undefined);
	setContext(LAYOUT_WIDTH_CONTEXT_KEY, widthOverride);

	const effectiveWidth = $derived($widthOverride ?? width);
</script>

<div class={[styles.layout, className, effectiveWidth === `wide` && styles.wide, effectiveWidth === `full` && styles.full]}>
	{#if $title}
		<h1 class={styles.title}>{@render $title()}</h1>
	{/if}
	{@render children()}
</div>
