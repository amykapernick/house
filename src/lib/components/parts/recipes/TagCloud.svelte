<script lang="ts">
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

<section class="tag-cloud">
	<div class="tag-cloud-header">
		<h2>Filter by tags</h2>
		{#if selectedTags.length}
			<button class="clear-tags" onclick={onClear}>Clear filters</button>
		{/if}
		<input
			type="text"
			class="tag-filter"
			placeholder="Find a tag..."
			aria-label="Find a tag"
			bind:value={tagSearch}
		/>
	</div>

	<div class="tag-list">
		{#each filteredTags as tag (tag.slug)}
			<input
				type="checkbox"
				id="tag-{tag.slug}"
				checked={selectedTags.includes(tag.slug)}
				onchange={() => onToggle(tag.slug)}
			/>
			<label class="tag-pill" for="tag-{tag.slug}">{tag.name}</label>
		{/each}
	</div>

	{#if !tagSearch && !showAllTags && tags.length > 40}
		<button class="show" onclick={() => showAllTags = true}>
			Show all {tags.length} tags
		</button>
	{:else if showAllTags && !tagSearch}
		<button class="show" onclick={() => showAllTags = false}>
			Show fewer
		</button>
	{/if}
</section>

<style>
	@import '@mixins';

	.tag-cloud {
		margin-bottom: 1.5em;
		padding: 1em;
		border: 1px solid light-dark(#ded0bd, #2c323d);
		border-radius: 0.5em;
		background: light-dark(var(--white), #1f242d);
		box-shadow: rgb(0 0 0 / 30%) 0 1px 2px, rgb(0 0 0 / 25%) 0 3px 10px;
	}

	.tag-cloud-header {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 0.8em;

		& h2 {
			margin: 0;
			font-size: 0.8em;
			text-transform: uppercase;
		}
	}

	.tag-filter {
		width: 180px;
		margin-left: auto;
		padding: 0.3em 0.5em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		font-size: 0.85em;
	}

	.clear-tags {

		@include button_secondary;

		padding: 0.2em 0.5em;
		font-size: 0.8em;
	}

	.tag-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3em;
		margin-bottom: 0.5em;
	}

	input[type="checkbox"] {

		@include sr_only;

		&:checked + .tag-pill {
			border-color: var(--purple_bright);
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}
	}

	.tag-pill {
		display: inline-flex;
		align-items: center;
		margin: 0;
		padding: 0.2em 0.6em;
		transition: all 0.15s;
		border: 1px solid var(--purple_bright);
		border-radius: 1em;
		background: transparent;
		color: var(--purple_bright);
		font-size: 0.8em;
		cursor: pointer;
		gap: 0.3em;

		&:hover {
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}
	}

	.show {

		@include button_text;

		font-size: 0.8em;
	}
</style>
