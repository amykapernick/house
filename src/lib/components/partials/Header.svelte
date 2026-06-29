<script lang="ts">
	import MainMenu from '$parts/MainMenu.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import type { MenuItem } from '$types/global';

	const menuItems: MenuItem[] = [
		{
			label: 'Home',
			link: '/',
		},
		{
			label: 'To Do',
			link: '/tasks',
			auth: true,
		},
		{
			label: 'Calendar',
			link: '/calendar',
			auth: true,
		},
		{
			label: 'Reference',
			link: '/reference',
			auth: true,
		},
		{
			label: 'Small Human',
			link: '/small-human',
			auth: true,
		},
	];

	function handleSignIn() {
		$clerk?.redirectToSignIn();
	}
</script>

<header class="header">
	<a href="/" class="title">🏡</a>
	<MainMenu {menuItems} isAuthenticated={$isAuthenticated}>
		{#if !$isAuthenticated}
			<li>
				<button onclick={handleSignIn}>Sign in</button>
			</li>
		{/if}
	</MainMenu>
</header>

<style>
	@import '@mixins';

	.header {
		@include container_spacing;

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		font-size: 1.2em;
		font-weight: 700;
	}

	.title {
		display: block;
		font-size: 3em;
		text-decoration: none;
	}
</style>
