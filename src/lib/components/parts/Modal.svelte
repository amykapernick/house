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
		max-width: 90vw;
		max-height: 90vh;
		padding: 2em 1.5em;
		border: 1px solid var(--border);
		border-radius: 1em;
		border-radius: 0.5em;
		background: light-dark(
			linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true))),
			linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)), color-mix(in oklch, var(--dark_background) 90%, var(--white)))
		);
		box-shadow: var(--shadow_popover);

		&::backdrop {
			background: rgb(0 0 0 / 70%);
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
