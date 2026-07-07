<script lang="ts">
	import '$styles/main.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { initClerk, isAuthenticated, clerkLoaded } from '$lib/auth';
	import { routeRequiresAuth } from '$lib/navigation';
	import Header from '$partials/Header.svelte';
	import Footer from '$partials/Footer.svelte';
	import Layout from '$layouts/Default.svelte';

	let { children } = $props();

	onMount(async () => {
		const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
		if (clerkPublishableKey) {
			await initClerk(clerkPublishableKey);
		}
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
	}

	.main {
		grid-area: main;
	}
</style>

<Header />
<main class="main">
	<Layout>
		{@render children()}
	</Layout>
</main>
<Footer />
