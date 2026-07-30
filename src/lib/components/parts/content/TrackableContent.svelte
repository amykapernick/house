<script lang="ts">
	import { renderMarkdown, type ContentChunk } from '$utils/markdown';
	import { trackReadDwell } from '$utils/readProgress';

	let {
		chunks,
		readAnchors,
		onToggleRead,
	}: {
		chunks: ContentChunk[];
		readAnchors: Set<string>;
		onToggleRead: (anchor: string) => void;
	} = $props();
</script>

<div class="content">
	{#each chunks as chunk (chunk.anchor ?? `intro`)}
		<div id={chunk.anchor ?? undefined}>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- chunk.markdown is curated Notion content, not raw user input -->
			{@html renderMarkdown(chunk.markdown)}
		</div>
		{#if chunk.trackable && chunk.anchor}
			{@const anchor = chunk.anchor}
			<button
				type="button"
				class="mark-read"
				class:read={readAnchors.has(anchor)}
				onclick={() => onToggleRead(anchor)}
				use:trackReadDwell={{ anchor, isAlreadyRead: () => readAnchors.has(anchor), onRead: onToggleRead }}
			>
				{readAnchors.has(anchor) ? `Marked as read - click to undo` : `Mark this section as read`}
			</button>
		{/if}
	{/each}
</div>

<style>
	@import '@mixins';

	.mark-read {
		@include button_secondary;

		margin: 1.5em 0 0;

		&.read {
			--button_text: var(--green);
			--button_border: var(--green);
		}
	}

	.content {
		max-width: 100%;
		overflow: hidden;
		line-height: 1.6;

		& :global(h2) {
			padding-bottom: 0.2em;
			border-bottom: 2px solid var(--navy);
		}

		& :global(img) {
			max-width: 100%;
		}
	}
</style>
