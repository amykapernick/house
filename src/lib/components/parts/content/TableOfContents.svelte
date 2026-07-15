<script lang="ts">
	import { computeTocRead, type TocEntry } from '$utils/markdown';
	import Contents from '$img/icons/search-content.svg?component'
	import Completed from '$img/icons/s-check.svg?component'

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
	<span class="container">
		<button type="button" class="toc-toggle" onclick={() => showToc = !showToc}>
			<span class="sr-only">{showToc ? `Hide contents` : `Show contents`}</span>
			<Contents />
		</button>
		{#if showToc}
			<nav class="toc" aria-label="Table of contents">
				<ol>
					{#each toc as entry (entry.anchor)}
						<li class:chapter={entry.level === 3}>
							<a href="#{entry.anchor}">{entry.text}</a>
							{#if tocRead.get(entry.anchor)}
								<span class="read-mark" title="Read"><Completed /></span>
							{/if}
						</li>
					{/each}
				</ol>
			</nav>
		{/if}
	</span>
{/if}

<style>
	@import '@mixins';
	
	.container {
		position: fixed;
		top: 5em;
		right: 1em;
	}

	.toc-toggle {

		@include button_icon;

		margin-left: auto;
	}

	.toc {
		position: absolute;
		right: 0;
		width: 80vw;
		max-width: max-content;
		margin: 10px 0 20px;
		padding: 15px 20px;
		border-radius: 0.5em;
		background: linear-gradient(
155deg, rgb(53 71 140) 0%, rgb(34 47 94) 55%, rgb(26 36 71) 100%);
		color: var(--navy_text);
		font-weight: 600;

		& ol {
			margin: 0;
			padding: 0;
		}

		& li {
			display: flex;
			align-items: center;
			gap: 0.4em;

			/* justify-content: space-between; */
		&.chapter {
			margin-left: 0.5em;
			list-style: circle;
		}
		}

		& a {
			color: inherit;
		}
	}

	.read-mark {
		order: -1;
		height: 1em;

		& :global(svg) {
			width: auto;
			height: 1em;
		}
	}
</style>
