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
	import { replayQueuedCompletions } from '$utils/completeTask';
	import Header from '$partials/Header.svelte';
	import Footer from '$partials/Footer.svelte';
	import Layout from '$layouts/Default.svelte';
	import CommandPalette from '$parts/CommandPalette.svelte';
	import TaskReminderBanner from '$parts/TaskReminderBanner.svelte';
	import FocusTimer from '$parts/FocusTimer.svelte';
	import OnlineStatus from '$parts/OnlineStatus.svelte';
	import { focusTimerState } from '$utils/focusTimer';
	import Timer from '$img/icons/stopwatch-fill.svg?component';
	import Search from '$img/icons/search-1.svg?component';

	let { children } = $props();

	let commandPaletteOpen = $state(false);
	let focusTimerOpen = $state(false);

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

	onMount(async () => {
		// Registered before Clerk init, not after - the two are independent (the SW's
		// install/fetch/cache logic doesn't touch auth), and blocking registration on
		// `await initClerk(...)` meant a slow/cold Clerk init - or a crawler whose visit
		// ends before Clerk finishes - could mean the service worker never registered at
		// all on a fresh visit. Only register in production - registering during `vite
		// dev` fights with its own module reloading and just causes confusing
		// stale-asset issues.
		if (import.meta.env.PROD && `serviceWorker` in navigator) {
			navigator.serviceWorker.register(`/service-worker.js`);
		}

		const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
		if (clerkPublishableKey) {
			await initClerk(clerkPublishableKey);
		}

		// Replays anything queued by completeTask.ts while offline. Only a live page
		// can do this - a service worker has no way to mint a fresh Clerk token on its
		// own (see completeTask.ts) - so this runs both once on load (covers "closed
		// the tab while offline, reopened later") and on every online transition
		// (covers "still had it open, connection dropped and came back"). Subscribing
		// inside onMount (not at the component's top level) matters here specifically -
		// adapter-static's `fallback: 'index.html'` prerenders this layout once during
		// the build in Node, where `indexedDB` doesn't exist; onMount never runs there.
		replayQueuedCompletions();
		isOnline.subscribe((online) => {
			if (online) replayQueuedCompletions();
		});

		// The service worker's `sync` handler can't authenticate a replay itself (see
		// service-worker.ts) - it just nudges any open page via postMessage instead.
		if (`serviceWorker` in navigator) {
			navigator.serviceWorker.addEventListener(`message`, (event) => {
				if (event.data?.type === `replay-queued-completions`) replayQueuedCompletions();
			});
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

	function openCommandPalette() {
		commandPaletteOpen = true;
	}

	afterNavigate(({ to }) => {
		if (to) recordPageVisit(to.url.pathname);
	});

	$effect(() => {
		if ($clerkLoaded && !$isAuthenticated && !page.url.pathname.startsWith('/sign-in') && routeRequiresAuth(page.url.pathname)) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the query string
			goto(`${resolve('/sign-in')}?redirect=${encodeURIComponent(page.url.pathname)}`);
		}
	});
</script>

<svelte:head>
	<title>{__SITE_TITLE__}</title>
	<meta
		name="description"
		content="Meal Planning, Tasks, Reminders, Calendars"
	/>
</svelte:head>

<svelte:window
	onkeydown={handleKeydown}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	ontouchcancel={handleTouchEnd}
/>

<OnlineStatus />

<button
	type="button"
	class="palette_trigger"
	onclick={openCommandPalette}
>
	<Search />
	<span class="sr-only">Open Command Palette</span>
</button>

<!-- TODO: Add a controls section -->
{#if !$focusTimerState}
	<button
		type="button"
		class="focus_timer_trigger"
		onclick={() => (focusTimerOpen = !focusTimerOpen)}
		aria-expanded={focusTimerOpen}
	>
		<Timer />
		<span class="sr-only">Toggle focus timer panel</span>
	</button>
{/if}

<Header />
<main class="main">
	<Layout
		wide={page.data.layoutWidth === 'wide'}
		full={page.data.layoutWidth === 'full'}
	>
		{@render children()}
	</Layout>
</main>
<Footer />
<CommandPalette
	bind:open={commandPaletteOpen}
	{menuItems}
	isAuthenticated={$isAuthenticated}
/>
<FocusTimer bind:open={focusTimerOpen} />
<TaskReminderBanner />

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

		/* margin-bottom: 5em; */
	}

	.palette_trigger {
		@include button_icon;

		position: fixed;
		z-index: 1000;
		right: 0.5em;
		bottom: 4.5rem;
		margin: 0;
		box-shadow: var(--shadow_soft);
		font-size: 1.3em;
	}

	.focus_timer_trigger {
		@include button_icon;

		position: fixed;
		z-index: 1000;
		right: 3.5em;
		bottom: 4.5rem;
		margin: 0;
		box-shadow: var(--shadow_soft);
		font-size: 1.3em;
	}

	@media (width >= 50em) {
		:global(body) {
			grid-template-areas: 'header main' 'header footer';
			grid-template-columns: auto 1fr;
			grid-template-rows: 1fr auto;
			max-height: 100vh;
			overflow: hidden;
		}

		.main {
			max-height: 100vh;
			overflow-y: auto;
		}
	}
</style>
