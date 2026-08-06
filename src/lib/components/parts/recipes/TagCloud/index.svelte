<script lang="ts">
	import styles from './index.module.css';

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

	let tagSearch = $state(``);
	let showAllTags = $state(false);

	let filteredTags = $derived.by(() => {
		let list = tags;
		if (tagSearch) list = list.filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()));
		if (!showAllTags && !tagSearch) return list.slice(0, 40);
		return list;
	});
</script>

<section class={styles["tag-cloud"]}>
	<div class={styles["tag-cloud-header"]}>
		<h2>Filter by tags</h2>
		{#if selectedTags.length}
			<button class={styles["clear-tags"]} onclick={onClear}>Clear filters</button>
		{/if}
		<input
			type="text"
			class={styles["tag-filter"]}
			placeholder="Find a tag..."
			aria-label="Find a tag"
			bind:value={tagSearch}
		/>
	</div>

	<div class={styles["tag-list"]}>
		{#each filteredTags as tag (tag.slug)}
			<input
				type="checkbox"
				id="tag-{tag.slug}"
				checked={selectedTags.includes(tag.slug)}
				onchange={() => onToggle(tag.slug)}
			/>
			<label class={styles["tag-pill"]} for="tag-{tag.slug}">{tag.name}</label>
		{/each}
	</div>

	{#if !tagSearch && !showAllTags && tags.length > 40}
		<button class={styles.show} onclick={() => showAllTags = true}>
			Show all {tags.length} tags
		</button>
	{:else if showAllTags && !tagSearch}
		<button class={styles.show} onclick={() => showAllTags = false}>
			Show fewer
		</button>
	{/if}
</section>
