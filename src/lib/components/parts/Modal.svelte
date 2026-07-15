<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		title,
		children,
		class: className = '',
	}: {
		open?: boolean;
		title?: string;
		children?: Snippet;
		class?: string;
	} = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) dialogEl.showModal();
		if (!open && dialogEl.open) dialogEl.close();
	});
</script>

<dialog
	class={className}
	bind:this={dialogEl}
	onclose={() => (open = false)}
	onclick={(e) => { if (e.target === dialogEl) open = false; }}
>
	<button class="close" onclick={() => (open = false)} aria-label="Close">×</button>
	{#if title}<h2>{title}</h2>{/if}
	{#if children}
		<div class="content">{@render children()}</div>
	{/if}
</dialog>

<style>
	dialog {
		border: none;
		border-radius: 1em;
		padding: 1.5em;
		max-width: 90vw;
		max-height: 90vh;
		color: var(--navy);

		&::backdrop {
			background: rgba(0, 0, 0, 0.6);
		}
	}

	h2 {
		margin: 0 1.5em 0.5em 0;
	}

	.close {
		position: absolute;
		top: 0.5em;
		right: 0.5em;
		border: none;
		background: none;
		font-size: 1.5em;
		line-height: 1;
		cursor: pointer;
		color: inherit;
	}
</style>
