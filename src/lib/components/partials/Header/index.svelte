<script lang="ts">
	import MainMenu from '$parts/MainMenu/index.svelte';
	import { isAuthenticated, clerk } from '$lib/auth';
	import { menuItems } from '$lib/navigation';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import fetchClientData from '$utils/fetchClientData';
	import Logo from '$img/monogram_colour.svg?component';
	import Switch from '$components/parts/Switch/index.svelte';
	import ProfileMenu from '$components/parts/ProfileMenu/index.svelte';
	import Moon from '$img/icons/moon.svg?component';
	import Sun from '$img/icons/u2600-sunrays.svg?component';
	import CollapseIcon from '$img/icons/double-arrow-right-outline.svg?component';
	import { theme, setTheme, type Theme } from '$utils/theme';
	import { sidebarCollapsed, setSidebarCollapsed } from '$utils/sidebarCollapsed';
	import styles from './index.module.css';

	let { class: className = '' }: { class?: string } = $props();

	function toggleSidebar() {
		setSidebarCollapsed(!$sidebarCollapsed);
	}

	// The switch's two options are positional (index 0/1, see Switch/index.svelte's
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

<header
	class={[styles.header, className, $sidebarCollapsed && styles.collapsed]}
>
	<a
		href={resolve('/')}
		class={styles.title}
	>
		<Logo />
		<span class={styles.name}>Household</span>
	</a>
	<Switch
		class={styles.theme}
		name="Colour Mode"
		value={themeOptions.indexOf($theme)}
		toggleFunction={handleThemeToggle}
		options={[
			{
				label: 'Dark Mode',
				Icon: Moon,
			},
			{
				label: 'Light Mode',
				Icon: Sun,
			},
		]}
	/>
	<MainMenu
		class="nav"
		{menuItems}
		isAuthenticated={$isAuthenticated}
		collapsed={$sidebarCollapsed}
	/>
	<button
		type="button"
		class={styles.collapse}
		onclick={toggleSidebar}
		aria-expanded={!$sidebarCollapsed}
	>
		<CollapseIcon class="icon" />
		<span class="sr-only">{$sidebarCollapsed ? 'Expand sidebar' : 'Minimise sidebar'}</span>
	</button>
	{#if $isAuthenticated}
		<ProfileMenu
			class={styles.profile}
			{profileName}
			{profileImage}
			onSignOut={handleSignOut}
		/>
	{:else}
		<button
			class={styles.profile}
			onclick={handleSignIn}>Sign in</button
		>
	{/if}
</header>
