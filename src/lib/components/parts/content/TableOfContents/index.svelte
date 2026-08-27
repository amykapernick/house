<script lang="ts">
	import { computeTocRead, type TocEntry } from '$utils/markdown';
	import { tocState, setTocHasEntries } from '$utils/toc';
	import Completed from '$img/icons/check-double-2.svg?component';
	import styles from './index.module.css';

	let {
		toc,
		readAnchors,
	}: {
		toc: TocEntry[];
		readAnchors: Set<string>;
	} = $props();

	let tocRead = $derived(computeTocRead(toc, readAnchors));

	$effect(() => {
		setTocHasEntries(toc.length > 0);
		return () => setTocHasEntries(false);
	});
</script>

{#if toc.length > 0 && $tocState.showToc}
	<nav
		class={styles.toc}
		aria-label="Table of contents"
	>
		<ol>
			{#each toc as entry (entry.anchor)}
				<li class={[entry.level === 3 && styles.chapter]}>
					<a href="#{entry.anchor}">{entry.text}</a>
					{#if tocRead.get(entry.anchor)}
						<span
							class={styles['read-mark']}
							title="Read"><Completed /></span
						>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
