<script lang="ts">
	import type { MenuItem } from '$types/global';
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		menuItems,
		isAuthenticated,
		children,
		collapsed = false,
		class: className = '',
	}: {
		menuItems: MenuItem[];
		isAuthenticated: boolean;
		children?: Snippet;
		collapsed?: boolean;
		class?: string;
	} = $props();
</script>

<nav
	class={[styles.root, className, collapsed && styles.collapsed]}
>
	<ul class={styles.menu}>
		{#each menuItems.filter(({ auth }) => !auth || isAuthenticated) as { label, link, Icon } (label)}
			<li>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is already resolve()d in navigation.ts -->
				<a href={link}>
					<Icon />
					<span class={styles.label}>{label}</span>
				</a>
			</li>
		{/each}
		{#if children}
			{@render children()}
		{/if}
	</ul>
</nav>
