<script lang="ts">
	import '$styles/main.css';
	import { onMount } from 'svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { initClerk, isAuthenticated, clerkLoaded } from '$lib/auth';
	import { routeRequiresAuth, menuItems } from '$lib/navigation';
	import { recordPageVisit } from '$utils/recentPages';
	import { isOnline } from '$utils/online';
	import { lastDataUpdate, clearAllCache } from '$utils/fetchClientData';
	import Header from '$partials/Header.svelte';
	import Footer from '$partials/Footer.svelte';
	import Layout from '$layouts/Default.svelte';
	import CommandPalette from '$parts/CommandPalette.svelte';
	import TaskReminderBanner from '$parts/TaskReminderBanner.svelte';

	let { children } = $props();

	let commandPaletteOpen = $state(false);

	// Mobile has no Cmd/Ctrl+K, so a swipe-down from the very top of the page opens
	// the palette instead - mirrors a pull-to-refresh gesture, which it also
	// suppresses (via preventDefault) once a downward drag is detected so the two
	// don't fire together.
	const SWIPE_ZONE_PX = 60;
	const SWIPE_THRESHOLD_PX = 80;
	let touchStartX = 0;
	let touchStartY = 0;
	let touchTracking = false;
	let swipeIsVertical: boolean | null = null;

	const lastUpdatedText = $derived(
		$lastDataUpdate
			? new Date($lastDataUpdate).toLocaleTimeString([], { hour: `2-digit`, minute: `2-digit` })
			: null,
	);

	onMount(async () => {
		const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
		if (clerkPublishableKey) {
			await initClerk(clerkPublishableKey);
		}

		// Only register in production - registering during `vite dev` fights with
		// its own module reloading and just causes confusing stale-asset issues.
		if (import.meta.env.PROD && `serviceWorker` in navigator) {
			navigator.serviceWorker.register(`/service-worker.js`);
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === `k`) {
			event.preventDefault();
			commandPaletteOpen = !commandPaletteOpen;
		}
	}

	function handleTouchStart(event: TouchEvent) {
		if (commandPaletteOpen || event.touches.length > 1 || window.scrollY > 0) return;
		const touch = event.touches[0];
		if (touch.clientY > SWIPE_ZONE_PX) return;
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchTracking = true;
		swipeIsVertical = null;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!touchTracking) return;
		const touch = event.touches[0];
		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;

		if (swipeIsVertical === null) {
			if (Math.hypot(deltaX, deltaY) < 10) return;
			swipeIsVertical = deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);
			if (!swipeIsVertical) {
				touchTracking = false;
				return;
			}
		}

		// Committed to a downward pull - block the native pull-to-refresh while tracking it.
		event.preventDefault();

		if (deltaY > SWIPE_THRESHOLD_PX) {
			commandPaletteOpen = true;
			touchTracking = false;
		}
	}

	function handleTouchEnd() {
		touchTracking = false;
		swipeIsVertical = null;
	}

	function handleRefresh() {
		clearAllCache();
		location.reload();
	}

	function openCommandPalette() {
		commandPaletteOpen = true;
	}

	afterNavigate(({ to }) => {
		if (to) recordPageVisit(to.url.pathname);
	});

	$effect(() => {
		if (
			$clerkLoaded &&
			!$isAuthenticated &&
			!page.url.pathname.startsWith('/sign-in') &&
			routeRequiresAuth(page.url.pathname)
		) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the query string
			goto(`${resolve('/sign-in')}?redirect=${encodeURIComponent(page.url.pathname)}`);
		}
	});
</script>

<svelte:head>
	<title>{__SITE_TITLE__}</title>
	<meta name="description" content="Meal Planning, Tasks, Reminders, Calendars" />
</svelte:head>

<svelte:window
	onkeydown={handleKeydown}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
/>

<!-- TODO: Make a smaller version, expand on hover -->
<p class="status_banner" class:offline={!$isOnline}>
	<span>{$isOnline ? `Online` : `Offline`}{#if lastUpdatedText} · Data updated {lastUpdatedText}{/if}</span>
	<button
		type="button"
		class="refresh"
		onclick={handleRefresh}
		disabled={!$isOnline}
		aria-label="Refresh data"
		title="Refresh data"
	>
		⟳
	</button>
</p>

<button
	type="button"
	class="palette_trigger"
	onclick={openCommandPalette}
	aria-label="Open command palette"
	title="Open command palette (Cmd/Ctrl+K)"
>
	🔍
</button>

<style>
	@import '@mixins';

	:global(body) {
		display: grid;
		grid-template-areas: 'header' 'main' 'footer';
		grid-template-rows: auto 1fr auto;
		max-width: 100vw;
		min-height: 100vh;
		margin: 0;
		overflow-x: hidden;
	}

	.main {
		grid-area: main;
		margin-bottom: 5em;
	}

	.status_banner {
		display: flex;
		position: fixed;
		z-index: 1000;
		bottom: 4.5rem;
		left: 1em;
		align-items: center;
		margin: 0;
		padding: 0.5em 1em;
		border-radius: 0.4em;
		background: var(--success);
		box-shadow: 0 0.1em 0.5em rgb(0 0 0 / 25%);
		color: var(--success_text);
		font-size: 0.7em;
		gap: 0.5em;

		&.offline {
			background: var(--warning);
			color: var(--warning_text);
		}

		& .refresh {
			padding: 0;
			border: none;
			background: transparent;
			color: inherit;
			font-size: 1.1em;
			line-height: 1;
			cursor: pointer;

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}

	.palette_trigger {

		@include button_icon;
		
		position: fixed;
		z-index: 1000;
		right: 0.5em;
		bottom: 4.5rem;
		margin: 0;
		box-shadow: 0 0.1em 0.5em rgb(0 0 0 / 25%);
		font-size: 1.3em;
	}

	@media(width >= 50em) {
		:global(body) {
			grid-template-areas: 'header main' 'header footer';
			grid-template-columns: auto 1fr;
			grid-template-rows: 1fr auto;
			max-height: 100vh;
			overflow: hidden;
		}

		.main {
			max-height: 100vh;
			margin-bottom: 50px;
			padding-bottom: 50px;
			overflow-y: auto;
		}

		.status_banner {
			right: 1rem;
			bottom: 2rem;
			left: auto;
		}
	}
</style>

<Header />
<main class="main">
	<Layout>
		{@render children()}
	</Layout>
</main>
<Footer />
<CommandPalette bind:open={commandPaletteOpen} {menuItems} isAuthenticated={$isAuthenticated} />
<TaskReminderBanner />
