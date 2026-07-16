<script lang="ts">
	import { isOnline } from "$utils/online";

	let {
		status,
		class: className = ''
	}: {
		// Defaults to the live connection state - only pass this to force a
		// specific state for preview/reference purposes.
		status?: 'online' | 'offline';
		class?: string;
	} = $props();

	let online = $derived(status ? status === 'online' : $isOnline);
</script>

<span class="status {className}" class:offline={!online}>
	<span class="dot" aria-hidden="true"></span>
	{online ? 'Online' : 'Offline'}
</span>

<style>
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		color: var(--success);
		font-weight: 600;

		&.offline {
			color: var(--error);
		}
	}

	.dot {
		width: 0.6em;
		height: 0.6em;
		border-radius: 50%;
		background: currentColor;
	}
</style>
