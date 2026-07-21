<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Snippet } from 'svelte';
	import Card from '$parts/Card.svelte';

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
			class="dismiss"
			onclick={onDismiss}
			aria-label="Dismiss {title}">&times;</button
		>
	{/if}
	<svelte:element
		this={`h${heading}`}
		class="heading">{title}</svelte:element
	>
	{#if children}
		<div class="content">{@render children()}</div>
	{/if}
</Card>

<style>
	:global(.card) {
		display: grid;
		grid-template-areas: 'heading' 'content';
		grid-template-rows: auto 1fr;
		order: var(--order);

		&:global(.has-dismiss) .heading {
			padding-right: 1.6em;
		}

		& :global(*:is(p)) {
			margin: 0;
		}
	}

	.heading {
		display: block;
		grid-area: heading;
		margin: 0 0 0.2em;
		padding: 0;
		color: var(--black);
	}

	.dismiss {
		display: flex;
		position: absolute;
		top: 0.4em;
		right: 0.4em;
		align-items: center;
		justify-content: center;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--transparent);
		color: var(--black);
		font-size: 1.1em;
		line-height: 1;
		cursor: pointer;

		&:hover {
			background: color-mix(in oklch, var(--colour) 20%, var(--transparent));
		}
	}

	.content {
		grid-area: content;
	}
</style>
