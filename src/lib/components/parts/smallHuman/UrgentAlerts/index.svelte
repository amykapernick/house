<script lang="ts">
	import type { Alert } from '$types/generated';
	import styles from './index.module.css';

	let {
		alerts,
		onDismiss,
	}: {
		alerts: Alert[];
		onDismiss: (alert: Alert) => void;
	} = $props();
</script>

<!-- TODO: Alerts don't seem to be dismissable anymore -->
{#if alerts.length}
	<div class={styles['urgent-alerts']}>
		{#each alerts as alert (alert.id)}
			<div class={styles['urgent-alert']}>
				<span class={styles['urgent-badge']}>Urgent</span>
				<div class={styles['urgent-body']}>
					<h2>{alert.title}</h2>
					<p>{alert.detail}</p>
				</div>
				<button
					type="button"
					class={styles['urgent-dismiss']}
					onclick={() => onDismiss(alert)}
					aria-label="Dismiss {alert.title}">&times;</button
				>
			</div>
		{/each}
	</div>
{/if}
