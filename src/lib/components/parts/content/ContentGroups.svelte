<script lang="ts">
	import { resolve } from '$app/paths';
	import { getReadAnchors } from '$utils/readProgress';
	import type { ContentGroup } from '$types/generated';

	let { groups, slug }: { groups: ContentGroup[]; slug: string } = $props();
</script>

<div class="groups">
	{#each groups as group (group.title)}
		<section class="group">
			<h2>{group.title}</h2>
			{#if group.description}
				<p>{group.description}</p>
			{/if}
			<ul class="list">
				{#each group.pages ?? [] as contentPage (contentPage?.slug)}
					<li>
						<a href={resolve(`/content/[slug]/[pageSlug]`, { slug, pageSlug: contentPage?.slug ?? `` })}>{contentPage?.title}</a>
						{#if contentPage?.slug && contentPage.sectionCount}
							{@const readCount = getReadAnchors(slug, contentPage.slug).size}
							{@const complete = readCount >= contentPage.sectionCount}
							<span class="progress" class:complete>
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

<style>
	.groups {
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.group {
		flex: 1 1 300px;
		padding: 20px;
		border-radius: 0.5em;
		background: var(--navy);
		color: var(--navy_text);

		& h2 {
			margin-top: 0;
		}
	}

	.list {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 5px;

		& a {
			color: inherit;
			font-weight: 600;

			&:hover {
				text-decoration: underline;
			}
		}

		& .progress {
			margin-left: 0.4em;
			color: var(--neutral);
			font-size: 0.85em;

			&.complete {
				color: var(--green);
				font-weight: 600;
			}
		}
	}
</style>
