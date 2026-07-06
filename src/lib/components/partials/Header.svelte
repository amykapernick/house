<script lang="ts">
	import MainMenu from '$parts/MainMenu.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import { menuItems } from '$lib/navigation';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	function handleSignIn() {
		goto(`/sign-in?redirect=${encodeURIComponent(page.url.pathname)}`);
	}

	function handleSignOut() {
		$clerk?.signOut({ redirectUrl: '/' });
	}
</script>

<header class="header">
	<a href="/" class="title">🏡</a>
	<MainMenu {menuItems} isAuthenticated={$isAuthenticated}>
		{#if $isAuthenticated}
			<li>
				<button onclick={handleSignOut}>Sign out</button>
			</li>
		{:else}
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
		grid-area: header;
	}

	.title {
		display: block;
		font-size: 3em;
		text-decoration: none;
	}
</style>
