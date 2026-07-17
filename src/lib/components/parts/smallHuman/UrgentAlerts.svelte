<script lang="ts">
	import type { Alert } from '$types/generated';

	let {
		alerts,
		onDismiss,
	}: {
		alerts: Alert[];
		onDismiss: (alert: Alert) => void;
	} = $props();
</script>

{#if alerts.length}
	<div class="urgent-alerts">
		{#each alerts as alert (alert.id)}
			<div class="urgent-alert">
				<span class="urgent-badge">Urgent</span>
				<div class="urgent-body">
					<h2>{alert.title}</h2>
					<p>{alert.detail}</p>
				</div>
				<button type="button" class="urgent-dismiss" onclick={() => onDismiss(alert)} aria-label="Dismiss {alert.title}">&times;</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.urgent-alerts {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		margin-bottom: 1.5em;
	}

	.urgent-alert {
		display: flex;
		align-items: flex-start;
		gap: 0.75em;
		padding: 1em;
		border: 2px solid var(--red);
		border-radius: 0.5em;
		background: color-mix(in srgb, var(--red) 12%, var(--white_true));
	}

	.urgent-badge {
		flex-shrink: 0;
		padding: 0.2em 0.6em;
		border-radius: 1em;
		background: var(--red);
		color: var(--red_text);
		font-size: 0.75em;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.urgent-dismiss {
		flex-shrink: 0;
		margin-left: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--transparent);
		color: var(--red);
		font-size: 1.1em;
		line-height: 1;
		cursor: pointer;

		&:hover {
			background: color-mix(in srgb, var(--red) 20%, var(--transparent));
		}
	}

	.urgent-body {
		& h2 {
			margin: 0 0 0.2em;
			font-size: 1.1em;
			color: var(--red);
		}

		& p {
			margin: 0;
		}
	}
</style>
