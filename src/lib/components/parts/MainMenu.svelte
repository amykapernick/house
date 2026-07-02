<script lang="ts">
	import type { MenuItem } from '$types/global';
	import type { Snippet } from 'svelte';

	let {
		menuItems,
		isAuthenticated,
		children,
	}: {
		menuItems: MenuItem[];
		isAuthenticated: boolean;
		children?: Snippet;
	} = $props();

	let subMenu = $state<string | false>(false);
</script>

<nav>
	<ul class="menu">
		{#each menuItems.filter(({ auth }) => !auth || isAuthenticated) as { label, link, items, Icon }}
			<li>
				{#if items}
					<button
						onclick={() => (subMenu = subMenu === label ? false : label)}
						aria-pressed={subMenu === label}
						data-active={subMenu === label}
						class="menu_section"
					>
						{label}
					</button>
					<ul class="sub" data-open={subMenu === label}>
						{#each items.filter(({ auth }) => !auth || isAuthenticated) as item}
							<li>
								<a href={item.link}>{item.label}</a>
							</li>
						{/each}
					</ul>
				{:else}
					<a href={link}>
						<span class="label">{label}</span>
						<Icon />
					</a>
				{/if}
			</li>
		{/each}
		{#if children}
			{@render children()}
		{/if}
	</ul>
</nav>

<style>
	@import '@mixins';

	.menu {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin: -10px;
		padding: 0;

		& li {
			position: relative;
			margin: 10px;
		}

		& a,
		& button {
			padding: 10px;
			color: inherit;
			font-size: inherit;
			font-weight: inherit;
		}
	}

	.sub {
		display: none;
		position: absolute;
		z-index: 50;
		top: 100%;
		left: 0;
		margin: 0;
		padding: 0;
		background: var(--background);
		box-shadow: 0 0 10px rgba($neutral, 0.2);
		font-size: 0.8em;
		list-style: none;

		&[data-open='true'] {
			display: block;
		}

		& li {
			margin: 0;
			padding: 0;
		}

		& a,
		& button {
			padding: 10px;
			background: var(--background);
			color: inherit;
			font-size: inherit;
			font-weight: inherit;
		}
	}

	.menu_section {
		@include button_text;
	}

	.label {
		@include sr_only;
	}

	@media (width <= 50em) {
		.sub {
			width: max-content;
		}
	}
</style>
