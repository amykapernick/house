<script lang="ts">
	import { resolve } from '$app/paths';
	import { getReadAnchors } from '$utils/readProgress';
	import type { ContentGroup } from '$types/generated';
	import styles from './index.module.css';

	let { groups, slug }: { groups: ContentGroup[]; slug: string } = $props();
</script>

<div class={styles.groups}>
	{#each groups as group (group.title)}
		<section class={styles.group}>
			<h2>{group.title}</h2>
			{#if group.description}
				<p>{group.description}</p>
			{/if}
			<ul class={styles.list}>
				{#each group.pages ?? [] as contentPage (contentPage?.slug)}
					<li>
						<a href={resolve(`/content/[slug]/[pageSlug]`, { slug, pageSlug: contentPage?.slug ?? `` })}>{contentPage?.title}</a>
						{#if contentPage?.slug && contentPage.sectionCount}
							{@const readCount = getReadAnchors(slug, contentPage.slug).size}
							{@const complete = readCount >= contentPage.sectionCount}
							<span class={[styles.progress, complete && styles.complete]}>
								{readCount}/{contentPage.sectionCount}
								{#if complete}<span title="Fully read">✓</span>{/if}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
