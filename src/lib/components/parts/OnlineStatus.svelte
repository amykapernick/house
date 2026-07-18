<script lang="ts">
	import { isOnline } from '$utils/online';
	import { lastDataUpdate, clearAllCache } from '$utils/fetchClientData';
	import Offline from '$img/icons/cloud_off.svg?component';
	import Pill from './Pill.svelte';

	const RELATIVE_TIME_REFRESH_MS = 30_000;

	function formatLastUpdated(date: Date): string {
		const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
		if (minutes < 1) return `<1 min`;
		if (minutes < 60) return `${minutes} min`;

		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr`;

		return `${Math.floor(hours / 24)} d`;
	}

	let lastUpdatedText: string | null = $state(null);

	$effect(() => {
		function refreshLastUpdatedText() {
			lastUpdatedText = $lastDataUpdate ? formatLastUpdated(new Date($lastDataUpdate)) : null;
		}

		refreshLastUpdatedText();
		const interval = setInterval(refreshLastUpdatedText, RELATIVE_TIME_REFRESH_MS);
		return () => clearInterval(interval);
	});

	function handleRefresh() {
		clearAllCache();
		location.reload();
	}

	function handleGoOffline() {
		isOnline.set(false);
	}
</script>

<span
	class="status_banner"
	class:offline={!$isOnline}
>
	<span
		class="dot"
		aria-hidden="true"
	></span>
	<span class="status">
		{$isOnline ? 'Online' : 'Offline'}
		{#if lastUpdatedText}· <span class="sr-only">Data updated</span> {lastUpdatedText}{/if}
	</span>

	<button
		type="button"
		class="refresh"
		onclick={handleRefresh}
		disabled={!$isOnline}
	>
		⟳
		<span class="sr-only">Refresh Data</span>
	</button>
	<button
		type="button"
		class="offline"
		onclick={handleGoOffline}
		disabled={!$isOnline}
	>
		<Offline />
		<span class="sr-only">Go Offline</span>
	</button>
</span>

<style>
	@import '@mixins';

	.dot {
		flex: 0 0 auto;
		width: 0.6em;
		height: 0.6em;
		border-radius: 50%;
		background: var(--success);
	}

	.status_banner {
		display: flex;
		position: fixed;
		z-index: 1000;
		bottom: 6.5em;
		left: 0.5em;
		align-items: center;
		height: 2.7em;
		margin: 0;
		padding: 0.7em 1em;
		border: 1px solid var(--border);
		border-radius: 2em;
		background: linear-gradient(var(--white_true), color-mix(in oklch, var(--background) 55%, var(--white_true)));
		box-shadow: var(--shadow_card);
		color: var(--text_secondary);
		font-size: 0.8em;
		font-weight: 600;
		gap: 8px;

		&::before {
			content: '';
			position: absolute;
			inset: -1em;
			z-index: -1;
		}

		&.offline {
			& .dot {
				background: var(--warning);
			}
		}

		&:not(&:hover, &:focus-within) {
			width: 2.7em;

			& .status,
			& button {

				@include sr_only;
			}
		}

		& button {

			@include button_icon;

			--button_background: var(--transparent);
			--button_text: var(--purple_bright);
			--button_border: var(--transparent);

			&:hover {
				--button_background: var(--gradient_background);
				--button_text: var(--purple_bright_text);
			}
		}

	@media (width >= 50em) {
			inset: 1em 1em auto auto
	}
	}
</style>
