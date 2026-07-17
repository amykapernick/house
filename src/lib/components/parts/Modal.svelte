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
	@import '@mixins';

	dialog {
		border-radius: 1em;
		padding: 2em 1.5em;
		max-width: 90vw;
		max-height: 90vh;
		border: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
		background: light-dark(
			linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true))),
			linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)), color-mix(in oklch, var(--dark_background) 90%, var(--white)))
		);
		border-radius: 0.5em;
		box-shadow: rgba(13, 13, 13, 0.04) 0px 1px 2px, rgba(95, 65, 50, 0.09) 0px 8px 20px;

		&::backdrop {
			background: rgba(0, 0, 0, 0.7);
		}
	}

	h2 {
		margin: 0 0 0.5em;
	}

	.close {
		@include button_secondary;
		@include button_icon;

		position: absolute;
		top: 0.5em;
		right: 0.5em;
	}
</style>
