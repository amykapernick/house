<script lang="ts" generics="T extends { slug?: string | null }">
	import type { Snippet } from 'svelte';

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
	<p>Loading...</p>
{:else if entries.length === 0}
	<p>{emptyMessage}</p>
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
