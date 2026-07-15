<script lang="ts">
	import { resolve } from '$app/paths';

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

<div class="profile-menu {className}">
	<button type="button" class="trigger" popovertarget={menuId}>
		<span class="label">Profile menu</span>
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
	</button>
	<div bind:this={menuEl} id={menuId} class="menu" popover>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used -->
		<a href={resolve('/profile')} onclick={handleProfileClick}>Profile</a>
		<button type="button" onclick={handleSignOut}>Sign out</button>
	</div>
</div>

<style>
	@import '@mixins';

	.profile-menu {
		display: block;

		/* anchor-name: --profile-menu; */
		position: relative;
		grid-area: profile;
	}

	.trigger {
		display: block;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5em;
		height: 1.5em;
		overflow: hidden;
		border-radius: 50%;
		background: var(--purple_bright);
		color: var(--purple_bright_text);
		font-size: 1em;
		line-height: 1;
		text-transform: uppercase;
		object-fit: cover;
	}

	.menu {
		display: none;
		position: absolute;

		/* position-area: bottom right; */

		/* position-anchor: --profile-menu; */
		inset: 3em 0.5em auto auto;
		flex-direction: column;
		width: max-content;
		margin: 0.5em 0.5em 0 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.5em;
		background: var(--base_colour);
		box-shadow: light-dark(rgb(13 13 13 / 4%), rgb(0 0 0 / 30%)) 0 1px 2px, light-dark(rgb(95 65 50 / 9%), rgb(0 0 0 / 35%)) 0 8px 20px;
		font-weight: 600;

		/* Author styles always win over the UA stylesheet's default
		   `display: none` for closed popovers, regardless of specificity -
		   so the open-state display has to be set explicitly here rather
		   than relying on the browser to restore it. */

		&:popover-open {
			display: flex;
		}

		& a, & button {
			padding: 0.5em 1em;
			border: none;
			border-radius: 0;
			background: none;
			color: inherit;
			font: inherit;
			text-align: left;
			text-decoration: none;
			cursor: pointer;

			&:hover {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}
	}

	.label {

		@include sr_only;
	}

	@media(width >= 50em) {
		.menu {
			inset: auto auto 7em 3.5em ;
		}
	}

	@media(width >= 60em) {
		.menu {
			inset: auto auto 1em 3.5em ;
		}
	}
</style>
