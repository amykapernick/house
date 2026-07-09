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
	import Header from '$partials/Header.svelte';
	import Footer from '$partials/Footer.svelte';
	import Layout from '$layouts/Default.svelte';
	import CommandPalette from '$parts/CommandPalette.svelte';

	let { children } = $props();

	let commandPaletteOpen = $state(false);

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
	<title>Kapers Crewe Household</title>
	<meta name="description" content="Meal Planning, Tasks, Reminders, Calendars" />
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

{#if !$isOnline}
	<p class="offline_banner">You're offline - showing the last cached data.</p>
{/if}

<style>
	:global(body) {
		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-areas: 'header' 'main' 'footer';
		max-width: 100vw;
		min-height: 100vh;
		margin: 0;
		overflow-x: hidden;
		background: var(--background);
		color: var(--background_text);
	}

	.main {
		grid-area: main;
	}

	.offline_banner {
		position: fixed;
		bottom: 1em;
		left: 1em;
		margin: 0;
		padding: 0.5em 1em;
		background: var(--warning);
		color: var(--warning_text);
		font-size: 0.85em;
		border-radius: 0.4em;
		box-shadow: 0 0.1em 0.5em rgba(0, 0, 0, 0.25);
		z-index: 1000;
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
