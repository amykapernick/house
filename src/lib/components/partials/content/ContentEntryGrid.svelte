<script lang="ts" generics="T extends { slug?: string | null }">
	import type { Snippet } from 'svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import EmptyState from '$parts/EmptyState.svelte';

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
	<ul class="list">
		{#each entries as entry (entry.slug)}
			{@render children(entry)}
		{/each}
	</ul>
{/if}

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
