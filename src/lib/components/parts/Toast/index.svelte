<script lang="ts">
	import styles from './index.module.css';

	let {
		message,
		variant = 'info',
		onDismiss,
		class: className = ''
	}: {
		message: string;
		variant?: 'success' | 'error' | 'info';
		onDismiss?: () => void;
		class?: string;
	} = $props();
</script>

<div class={[styles.toast, styles[variant], className]} role="status" aria-live="polite">
	<span class={styles.message}>{message}</span>
	{#if onDismiss}
		<button type="button" class={styles.dismiss} onclick={onDismiss} aria-label="Dismiss">&times;</button>
	{/if}
</div>
