<script lang="ts">
	import type { Colour } from "$types/global";
	import type { Component, Snippet } from "svelte";
	import Icon from "./Icon.svelte";
	import type { IconName } from "./Icon.svelte";

	const { title, heading = 3, children, colour, icon, footer, tags, order = 0, IconComponent, iconProps }: {
		title: string;
		heading?: 2 | 3 | 4 | 5 | 6;
		children?: Snippet;
		colour?: Colour;
		icon?: IconName;
		IconComponent?: Component<any>;
		iconProps?: Record<string, any>;
		footer?: string | Snippet;
		tags?: string;
		order?: number
	} = $props();
</script>

<div
	class="card"
	style="--colour: var(--{colour || 'blue'}); --order: {order}"
>
	<svelte:element this={`h${heading}`} class="heading">{title}</svelte:element>
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
</div>

<style>
	.card {
		border-radius: 1em;
		border: 2px solid var(--colour);
		width: auto;
		padding: 0.5em 0.75em;
		color: var(--colour);
		background: color-mix(in srgb, var(--colour) 10%, white);
		display: grid;
		grid-template-rows: auto 1fr auto auto;
		grid-template-columns: 1fr auto;
		grid-template-areas: 
			'heading 	heading'
			'content 	content'
			'tags		.'
			'footer		icon';
		order: var(--order);
	}

	.heading {
		color: var(--colour);
		display: block;
		margin: 0 0 0.2em;
		padding: 0 0.2em;
		grid-area: heading;
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

		:global(svg) {
			height: 2em;
			width: auto;
		}
	}

	.footer {
		grid-area: footer;
		font-weight: bolder;
	}

	.footer, .icon {
		align-self: end;
	}
</style>
