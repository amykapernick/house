<script lang="ts">
	import { page } from '$app/state';
	import { clerk, clerkLoaded } from '$lib/auth';
	import { getPageTitle } from '$utils/pageTitle';

	let container: HTMLDivElement | undefined = $state();

	const redirectTarget = $derived(page.url.searchParams.get('redirect') || '/');

	$effect(() => {
		if (!$clerkLoaded || !$clerk || !container) return;

		const clerkInstance = $clerk;
		const target = container;

		clerkInstance.mountSignIn(target, {
			routing: 'path',
			path: '/sign-in',
			fallbackRedirectUrl: redirectTarget,
		});

		return () => clerkInstance.unmountSignIn(target);
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Sign In`)}</title>
</svelte:head>

<section class="sign-in">
	<div bind:this={container}></div>
</section>

<style>
	.sign-in {
		display: flex;
		justify-content: center;
		padding: 2em 0;
	}
</style>
