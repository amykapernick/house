<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Component, Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { IconName } from './Icon.svelte';
	import Card from '$parts/Card.svelte';

	const {
		title,
		heading = 3,
		children,
		icon,
		footer,
		tags,
		order = 0,
		IconComponent,
		iconProps,
		onDismiss,
		class: className = '',
	}: {
		title: string;
		heading?: 2 | 3 | 4 | 5 | 6;
		children?: Snippet;
		colour?: Colour;
		icon?: IconName;
		IconComponent?: Component<any>;
		iconProps?: Record<string, any>;
		footer?: string | Snippet;
		tags?: string;
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
	{#if tags}
		<span class="tags">{tags}</span>
	{/if}
	{#if footer}
		<span class="footer">
			{#if typeof footer === 'function'}
				{@render footer()}
			{:else}
				{footer}
			{/if}
		</span>
	{/if}
	{#if icon}
		<div class="icon">
			<Icon name={icon} />
		</div>
	{/if}
	{#if IconComponent}
		<div class="icon">
			<IconComponent {...iconProps} />
		</div>
	{/if}
</Card>

<style>
	:global(.card) {
		display: grid;
		position: relative;
		grid-template-areas:
			'heading heading'
			'content content'
			'tags .'
			'footer icon';
		grid-template-columns: 1fr auto;
		grid-template-rows: auto 1fr auto auto;
		order: var(--order);
		width: auto;
		padding: 0.5em 0.75em;
		border: 2px solid var(--colour);
		border-radius: 1em;
		background: color-mix(in oklch, var(--colour) 10%, var(--white_true));
		color: var(--black);

		&:global(.has-dismiss) .heading {
			padding-right: 1.6em;
		}
	}

	.heading {
		display: block;
		grid-area: heading;
		margin: 0 0 0.2em;
		padding: 0 0.2em;
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

	.tags {
		grid-area: tags;
	}

	.icon {
		grid-area: icon;
		justify-self: end;
		height: auto;
		line-height: 1;

		& :global(svg) {
			width: auto;
			height: 2em;
		}
	}

	.footer {
		grid-area: footer;
		font-weight: bolder;
	}

	.footer,
	.icon {
		align-self: end;
	}
</style>
