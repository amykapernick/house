<script lang="ts">
	import { resolve } from '$app/paths';
	import styles from './index.module.css';

	let {
		profileName,
		profileImage,
		onSignOut,
		class: className = '',
	}: {
		profileName: string;
		profileImage: string;
		onSignOut: () => void;
		class?: string;
	} = $props();

	const menuId = $props.id();
	let menuEl: HTMLDivElement | undefined = $state();

	function handleSignOut() {
		menuEl?.hidePopover();
		onSignOut();
	}

	function handleProfileClick() {
		menuEl?.hidePopover();
	}
</script>

<div class="{styles['profile-menu']} {className}">
	<button type="button" class={styles.trigger} popovertarget={menuId}>
		<span class={styles.label}>Profile menu</span>
		{#if profileImage}
			<img class={styles.avatar} src={profileImage} alt="" />
		{:else}
			<span class={styles.avatar}>
				{profileName
					.split(' ')
					.filter(Boolean)
					.map((word) => word[0])
					.join('')}
			</span>
		{/if}
	</button>
	<div bind:this={menuEl} id={menuId} class={styles.menu} popover>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used -->
		<a href={resolve('/profile')} onclick={handleProfileClick}>Profile</a>
		<button type="button" onclick={handleSignOut}>Sign out</button>
	</div>
</div>
