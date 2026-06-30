<script lang="ts">
	import '$styles/main.css';
	import { onMount } from 'svelte';
	import { initClerk } from '$lib/auth';
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
</script>

<svelte:head>
	<title>Kapers Crewe Household</title>
	<meta name="description" content="Meal Planning, Tasks, Reminders, Calendars" />
</svelte:head>

<style>
	:global(body) {
		display: grid;
		grid-template-rows: auto 1fr auto;
		max-width: 100vw;
		min-height: 100vh;
		margin: 0;
		overflow-x: hidden;
		background: var(--background);
	}
</style>

<Header />
<main>
	<Layout>
		{@render children()}
	</Layout>
</main>
<Footer />
