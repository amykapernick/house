<script lang="ts">
	import { renderMarkdown, type ContentChunk } from '$utils/markdown';
	import { trackReadDwell } from '$utils/readProgress';
	import styles from './index.module.css';

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

<div class={styles.content}>
	{#each chunks as chunk (chunk.anchor ?? `intro`)}
		<div id={chunk.anchor ?? undefined}>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- chunk.markdown is curated Notion content, not raw user input -->
			{@html renderMarkdown(chunk.markdown)}
		</div>
		{#if chunk.trackable && chunk.anchor}
			{@const anchor = chunk.anchor}
			<button
				type="button"
				class={[styles['mark-read'], readAnchors.has(anchor) && styles.read]}
				onclick={() => onToggleRead(anchor)}
				use:trackReadDwell={{ anchor, isAlreadyRead: () => readAnchors.has(anchor), onRead: onToggleRead }}
			>
				{readAnchors.has(anchor) ? `Marked as read - click to undo` : `Mark this section as read`}
			</button>
		{/if}
	{/each}
</div>
