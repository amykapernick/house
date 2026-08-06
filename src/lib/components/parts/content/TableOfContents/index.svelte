<script lang="ts">
	import { computeTocRead, type TocEntry } from '$utils/markdown';
	import Contents from '$img/icons/paragraph-2.svg?component';
	import Completed from '$img/icons/check-double-2.svg?component';
	import styles from './index.module.css';

	let {
		toc,
		readAnchors,
		showToc = $bindable(false),
	}: {
		toc: TocEntry[];
		readAnchors: Set<string>;
		showToc?: boolean;
	} = $props();

	let tocRead = $derived(computeTocRead(toc, readAnchors));
</script>

{#if toc.length > 0}
	<span class={styles.container}>
		<button
			type="button"
			class={styles['toc-toggle']}
			onclick={() => (showToc = !showToc)}
		>
			<span class="sr-only">{showToc ? `Hide contents` : `Show contents`}</span>
			<Contents />
		</button>
		{#if showToc}
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
	</span>
{/if}
