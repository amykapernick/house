<script lang="ts">
	import styles from './index.module.css';

	// Roughly 2 rows' worth of pills at typical tag-name lengths - CSS-only
	// row clamping isn't reliable here since pill width varies a lot with
	// name length, so this collapses by a plain count instead.
	const COLLAPSED_TAG_COUNT = 20;

	let {
		tags,
		selectedTags,
		onToggle,
		onClear,
	}: {
		tags: { name: string, slug: string }[];
		selectedTags: string[];
		onToggle: (slug: string) => void;
		onClear: () => void;
	} = $props();

	let showAllTags = $state(false);

	let visibleTags = $derived(showAllTags ? tags : tags.slice(0, COLLAPSED_TAG_COUNT));
</script>

<section class={styles["tag-cloud"]}>
	<div class={styles["tag-cloud-header"]}>
		<h2>Filter by tags</h2>
		{#if selectedTags.length}
			<button class={styles["clear-tags"]} onclick={onClear}>Clear filters</button>
		{/if}
	</div>

	<div class={styles["tag-list"]}>
		{#each visibleTags as tag (tag.slug)}
			<input
				type="checkbox"
				id="tag-{tag.slug}"
				checked={selectedTags.includes(tag.slug)}
				onchange={() => onToggle(tag.slug)}
			/>
			<label class={styles["tag-pill"]} for="tag-{tag.slug}">{tag.name}</label>
		{/each}
	</div>

	{#if tags.length > COLLAPSED_TAG_COUNT}
		{#if !showAllTags}
			<button class={styles.show} onclick={() => showAllTags = true}>
				Show all {tags.length} tags
			</button>
		{:else}
			<button class={styles.show} onclick={() => showAllTags = false}>
				Show fewer
			</button>
		{/if}
	{/if}
</section>
