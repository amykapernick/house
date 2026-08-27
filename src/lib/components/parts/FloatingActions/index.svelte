<script lang="ts">
	import { focusTimerState } from '$utils/focusTimer';
	import { tocState, toggleToc } from '$utils/toc';
	import CommandPalette from '../CommandPalette/index.svelte';
	import FocusTimer from '../FocusTimer/index.svelte';
	import Menu from '$img/icons/cursor-menu-fill.svg?component';
	import Close from '$img/icons/close.svg?component';
	import Timer from '$img/icons/stopwatch-fill.svg?component';
	import Search from '$img/icons/search-1.svg?component';
	import Contents from '$img/icons/paragraph-2.svg?component';
	import type { MenuItem } from '$types/global';
	import styles from './index.module.css';

	let {
		commandPaletteOpen = $bindable(false),
		focusTimerOpen = $bindable(false),
		menuItems,
		isAuthenticated,
	}: {
		commandPaletteOpen?: boolean;
		focusTimerOpen?: boolean;
		menuItems: MenuItem[];
		isAuthenticated: boolean;
	} = $props();

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function openCommandPalette() {
		commandPaletteOpen = true;
		menuOpen = false;
	}

	function toggleFocusTimer() {
		focusTimerOpen = !focusTimerOpen;
		menuOpen = false;
	}

	function toggleTableOfContents() {
		toggleToc();
		menuOpen = false;
	}
</script>

<div class={styles.actions}>
	{#if menuOpen}
		<button
			type="button"
			class={styles.action}
			onclick={openCommandPalette}
		>
			<Search />
			<span class="sr-only">Open Command Palette</span>
		</button>
	{/if}
	{#if menuOpen || $focusTimerState}
		<button
			type="button"
			class={styles.action}
			onclick={toggleFocusTimer}
			aria-expanded={focusTimerOpen}
		>
			<Timer />
			<span class="sr-only">Toggle focus timer panel</span>
		</button>
	{/if}
	{#if menuOpen || $tocState.hasEntries}
		<button
			type="button"
			class={styles.action}
			onclick={toggleTableOfContents}
			aria-expanded={$tocState.showToc}
		>
			<Contents />
			<span class="sr-only">{$tocState.showToc ? `Hide` : `Show`} table of contents</span>
		</button>
	{/if}
	<button
		type="button"
		class={styles.trigger}
		onclick={toggleMenu}
		aria-expanded={menuOpen}
	>
		{#if menuOpen}
			<Close />
		{:else}
			<Menu />
		{/if}
		<span class="sr-only">{menuOpen ? `Close` : `Open`} quick actions</span>
	</button>
</div>

<CommandPalette
	bind:open={commandPaletteOpen}
	{menuItems}
	{isAuthenticated}
/>
<FocusTimer bind:open={focusTimerOpen} />
