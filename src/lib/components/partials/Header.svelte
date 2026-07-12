<script lang="ts">
	import MainMenu from '$parts/MainMenu.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import { menuItems } from '$lib/navigation';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import fetchClientData from '$utils/fetchClientData';

	let profileImage = $state('');
	let profileName = $state('');

	function handleSignIn() {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the query string
		goto(`${resolve('/sign-in')}?redirect=${encodeURIComponent(page.url.pathname)}`);
	}

	function handleSignOut() {
		$clerk?.signOut({ redirectUrl: '/' });
	}

	// Separate cache key from the profile page's `me` query (which also fetches
	// colour/ids) - sharing a key would let whichever query ran last overwrite
	// the cache with a partial `me` object for the other consumer.
	$effect(() => {
		if (!$isAuthenticated) return;

		fetchClientData({
			cacheKey: 'header-me',
			gqlQuery: `
				query {
					me { name profile }
				}
			`,
		}).then((res) => {
			profileName = res?.me?.name ?? '';
			profileImage = res?.me?.profile ?? '';
		});
	});
</script>

<header class="header">
	<a href={resolve('/')} class="title">🏡</a>
	<MainMenu {menuItems} isAuthenticated={$isAuthenticated}>
		{#if $isAuthenticated}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used -->
				<a href={resolve('/profile')} class="profile-link">
					<span class="label">Profile</span>
					{#if profileImage}
						<img class="avatar" src={profileImage} alt="" />
					{:else}
						<span class="avatar">
							{profileName
								.split(' ')
								.filter(Boolean)
								.map((word) => word[0])
								.join('')}
						</span>
					{/if}
				</a>
			</li>
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

	.profile-link {
		display: block;
	}

	.label {
		@include sr_only;
	}

	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1em;
		height: 1em;
		overflow: hidden;
		border-radius: 50%;
		background: var(--purple_bright);
		color: var(--purple_bright_text);
		font-size: 1em;
		line-height: 1;
		text-transform: uppercase;
		object-fit: cover;
	}
</style>
