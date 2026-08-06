<script
	module
	lang="ts"
>
	export type ModalAction = {
		label: string;
		onclick: () => void;
		variant?: 'success' | 'danger' | 'warning' | 'none';
		style?: 'primary' | 'secondary';
		disabled?: boolean;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		title,
		children,
		actions = [],
		class: className = '',
	}: {
		open?: boolean;
		title?: string;
		children?: Snippet;
		actions?: ModalAction[];
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
	class="{styles.root} {className}"
	bind:this={dialogEl}
	onclose={() => (open = false)}
	onclick={(e) => {
		if (e.target === dialogEl) open = false;
	}}
>
	<button
		class={styles.close}
		onclick={() => (open = false)}
		aria-label="Close">×</button
	>
	{#if title}<h2>{title}</h2>{/if}
	{#if children}
		<div class="content">{@render children()}</div>
	{/if}
	{#if actions.length}
		<div class={styles.actions}>
			{#each actions as action (action.label)}
				<button
					type="button"
					class={[action.style === 'secondary' && styles.secondary, action.variant && action.variant !== 'none' && styles[action.variant]].filter(Boolean).join(' ')}
					onclick={action.onclick}
					disabled={action.disabled}>{action.label}</button
				>
			{/each}
		</div>
	{/if}
</dialog>
