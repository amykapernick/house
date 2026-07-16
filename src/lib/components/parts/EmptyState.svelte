<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		title,
		message,
		children,
		class: className = ''
	}: {
		title: string;
		message?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="empty-state {className}">
	<h3>{title}</h3>
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
		gap: 0.3em;
		padding: 2em 1em;
		text-align: center;
		color: var(--grey);

		& h3 {
			margin: 0;
			color: var(--black);
		}

		& p {
			margin: 0;
		}
	}

	.actions {
		margin-top: 0.8em;
	}
</style>
