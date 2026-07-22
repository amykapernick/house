<script lang="ts">
	import type { Snippet } from 'svelte';

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

<div class="empty-state {className} {page && 'page'}">
	<h2>{title}</h2>
	{#if message}<p>{message}</p>{/if}
	{#if children}
		<div class="actions">{@render children()}</div>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		&::before {
			content: '';
			display: block;
			width: 2em;
			height: 2em;
			border: 1.5px dashed color-mix(in oklch, var(--background) 78%, var(--black));
			border-radius: 0.8em;
		}

		&.page {
			margin-top: 20vh;
			font-size: 1.5em;
		}
	}

	h2 {
		color: var(--text_secondary);
	}

	.actions {
		margin-top: 0.8em;
	}
</style>
