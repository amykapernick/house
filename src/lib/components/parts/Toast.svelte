<script lang="ts">
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

<div class="toast {variant} {className}" role="status" aria-live="polite">
	<span class="message">{message}</span>
	{#if onDismiss}
		<button type="button" class="dismiss" onclick={onDismiss} aria-label="Dismiss">&times;</button>
	{/if}
</div>

<style>
	.toast {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: max-content;
		max-width: 100%;
		padding: 0.7em 1em;
		border-radius: 0.5em;
		background: var(--black);
		color: var(--white);
		box-shadow: rgba(13, 13, 13, 0.04) 0px 1px 2px, rgba(95, 65, 50, 0.09) 0px 8px 20px;

		&.success {
			background: var(--success);
			color: var(--success_text);
		}

		&.error {
			background: var(--error);
			color: var(--error_text);
		}
	}

	.message {
		flex: 1;
	}

	.dismiss {
		flex-shrink: 0;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font-size: 1.2em;
		line-height: 1;
		cursor: pointer;
		opacity: 0.8;

		&:hover {
			opacity: 1;
		}
	}
</style>
