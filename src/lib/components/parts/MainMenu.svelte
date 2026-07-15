<script lang="ts">
	import type { MenuItem } from '$types/global';
	import type { Snippet } from 'svelte';

	let {
		menuItems,
		isAuthenticated,
		children,
		class: className = '',
	}: {
		menuItems: MenuItem[];
		isAuthenticated: boolean;
		children?: Snippet;
		class?: string;
	} = $props();

</script>

<nav class={className}>
	<ul class="menu">
		{#each menuItems.filter(({ auth }) => !auth || isAuthenticated) as { label, link, Icon } (label)}
			<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is already resolve()d in navigation.ts -->
					<a href={link}>
						<Icon />
						<span class="label">{label}</span>
						
					</a>
			</li>
		{/each}
		{#if children}
			{@render children()}
		{/if}
	</ul> 
</nav>

<style>
	@import '@mixins';

	nav {
		display: block;
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		grid-area: menu;
		overflow-x: auto;
		border: 1px solid var(--header_border);
		background: var(--header_background); 
		font-size: 1.2em;
		font-weight: 700;
	}

	.menu {
		display: flex;
		justify-content: start;
		margin: 0;
		padding: 0 0.1em;

		& li {
			position: relative;
			margin: 10px;
		}

		& a {
			padding: 10px;
			color: light-dark(var(--black), var(--navy));
			font-size: inherit;
			font-weight: inherit;

			&:hover {
				--gradient_base: var(--background);

				background: light-dark(linear-gradient(rgb(242 231 212) 0%, rgb(226 208 180) 100%), linear-gradient(rgb(42 51 70) 0%, rgb(51 62 86) 100%));
			}
		}
	}

	.label {

		@include sr_only;
	}

	@media(width >= 50em) {
		nav {
			position: static;
			overflow: hidden auto;
			border: none;
			font-size: 1em;
		}

		.menu {
			display: block;
			justify-content: start;
			margin: 0;
			padding: 0;
		}
	}

	@media(width >= 60em) {
		.label {

			@include remove_sr_only;

			
		}

		.menu {
			& a {
				display: flex;
				align-items: center;
				padding: 0.2em 0.5em;
				border-radius: 10px;
				font-size: inherit;
				font-weight: inherit;
				gap: 0.5em;
			}
		}
	}
</style>
