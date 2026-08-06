<script lang="ts" generics="T extends { slug?: string | null }">
	import type { Snippet } from 'svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import styles from './index.module.css';

	let {
		entries,
		loading,
		emptyMessage,
		children,
	}: {
		entries: T[];
		loading: boolean;
		emptyMessage: string;
		children: Snippet<[T]>;
	} = $props();
</script>

{#if loading}
	<Skeleton rows={3} />
{:else if entries.length === 0}
	<EmptyState title={emptyMessage} />
{:else}
	<ul class={styles.list}>
		{#each entries as entry (entry.slug)}
			{@render children(entry)}
		{/each}
	</ul>
{/if}
