<script lang="ts">
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	// Shared by both dashboard-style pages (the household dashboard at `/` and
	// the weather/astro dashboard at `/dashboard`) - every widget on either
	// page is a heading + optional header actions (a link, a switch) + body,
	// so that wrapper lives here once instead of being repeated per widget.
	let {
		title,
		headingVisible = true,
		actions,
		children,
		class: className = '',
	}: {
		title: string;
		/** Some widgets (the weather dashboard's cards) show their own title
		 * internally and only need this heading for a11y structure. */
		headingVisible?: boolean;
		actions?: Snippet;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<section class={className}>
	<div class={styles.header}>
		<h2 class={headingVisible ? styles.heading : 'sr-only'}>{title}</h2>
		{#if actions}
			{@render actions()}
		{/if}
	</div>
	{@render children()}
</section>
