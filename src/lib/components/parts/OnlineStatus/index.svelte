<script lang="ts">
	import { isOnline } from '$utils/online';
	import { lastDataUpdate, clearAllCache } from '$utils/fetchClientData';
	import Offline from '$img/icons/offline-fill.svg?component';
	import Refresh from '$img/icons/cloud-data-sync-fill.svg?component';
	import Pill from '../Pill/index.svelte';
	import styles from './index.module.css';

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
	class={[styles.status_banner, !$isOnline && styles.offline]}
>
	<span
		class={styles.dot}
		aria-hidden="true"
	></span>
	<span class={styles.status}>
		{$isOnline ? 'Online' : 'Offline'}
		{#if lastUpdatedText}· <span class="sr-only">Data updated</span> {lastUpdatedText}{/if}
	</span>

	<button
		type="button"
		class="refresh"
		onclick={handleRefresh}
		disabled={!$isOnline}
	>
		<Refresh />
		<span class="sr-only">Refresh Data</span>
	</button>
	<button
		type="button"
		class={styles.offline}
		onclick={handleGoOffline}
		disabled={!$isOnline}
	>
		<Offline />
		<span class="sr-only">Go Offline</span>
	</button>
</span>
