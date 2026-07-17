<script lang="ts">
	import MainMenu from '$parts/MainMenu.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import { menuItems } from '$lib/navigation';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import fetchClientData from '$utils/fetchClientData';
	import Logo from '$img/monogram_colour.svg?component'
	import Switch from '$components/parts/Switch.svelte';
	import ProfileMenu from '$components/parts/ProfileMenu.svelte';
	import Moon from '$img/icons/moon.svg?component'
	import Sun from '$img/icons/u2600-sunrays.svg?component'
	import { theme, setTheme, type Theme } from '$utils/theme';

	let { class: className = '' }: { class?: string } = $props();

	// The switch's two options are positional (index 0/1, see Switch.svelte's
	// CSS-driven thumb) - this order is what ties that position back to an
	// actual theme value.
	const themeOptions: Theme[] = [`dark`, `light`];

	function handleThemeToggle(index: number) {
		setTheme(themeOptions[index]);
	}

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

<header class="header {className}">
	<a href={resolve('/')} class="title">
		<Logo />
		<span class="name">Household</span>
	</a>
	<Switch
		class="theme"
		name="Colour Mode"
		value={themeOptions.indexOf($theme)}
		toggleFunction={handleThemeToggle}
		options={[
			{
				label: "Dark Mode",
				Icon: Moon
			},
			{
				label: "Light Mode",
				Icon: Sun
			}
		]}
	/>
	<MainMenu class="nav" {menuItems} isAuthenticated={$isAuthenticated} />
	{#if $isAuthenticated}
			<ProfileMenu class="profile" {profileName} {profileImage} onSignOut={handleSignOut} />
	{:else}
			<button class="profile" onclick={handleSignIn}>Sign in</button>
	{/if}
</header>

<style>
	@import '@mixins';

	.header {

		@include container_spacing;

		/* TODO: replace this with proper reference */
		--header_background: light-dark(#efe3d5, #191d25);

		/* TODO: Replace with proper reference */
		--header_border: light-dark(#ded0bd, #2c323d);

		display: grid;
		position: fixed;
		z-index: 50;
		top: 0;
		right: 0;
		left: 0;
		grid-area: header;
		grid-template-areas: 'title toggle profile';
		grid-template-columns: 1fr auto auto;
		align-items: center;
		border-bottom-width: 1px;
		border-bottom-style: solid;
		border-color: var(--header_border);
		background: var(--header_background);
		gap: 0.5em;
	}

	.title {
		display: flex;
		grid-area: title;
		align-items: center;
		margin-right: auto;
		color: light-dark(var(--navy), var(--purple));
		font-size: 1.5em;
		font-weight: 700;
		text-decoration: none;
		gap: 0.2em;

		& :global(svg) {
			height: 1.5em;
		}
	}

	.theme {
		grid-area: theme;
	}

	.profile {
		grid-area: profile;
	}

	@media(width >= 50em) {
		.header {
			position: static;
			grid-template-areas: 
				'title '
				'menu'
				'toggle'
				'profile';
			grid-template-columns: auto;
			grid-template-rows: auto 1fr auto auto;
			place-items: start center;
			justify-content: center;
			width: max-content;
			max-width: 200px;
			padding: 20px;
			gap: 20px;

		}

		.title {
			font-size: 2em;
			gap: 0.5em;

			& .name {

				@include sr_only;
			}
		}
	}

	@media(width >= 60em) {
		.header {
			grid-template-areas: 
				'title toggle'
				'menu menu'
				'profile profile';
			grid-template-columns: 1fr auto;
			grid-template-rows: auto 1fr auto;
			justify-items: start;
			max-width: 250px;
		}
	}
</style>
