<script lang="ts">
	import { page } from '$app/stores';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { CONTENT_CACHE_TTL, contentEntriesQuery, contentIndexQuery } from '$utils/content';
	import { getReadAnchors } from '$utils/readProgress';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import type { ContentEntry, ContentGroup } from '$types/generated';

	let entry = $state<ContentEntry | null>(null);
	let groups = $state<ContentGroup[]>([]);
	let loading = $state(true);

	$effect(() => {
		const slug = $page.params.slug ?? ``;

		if ($isAuthenticated && slug) {
			loading = true;

			// Short-lived (default TTL) - Notion's uploaded-file icon URLs expire
			// after about an hour, so entry metadata isn't cached alongside the
			// long-lived course content below.
			fetchClientData({
				cacheKey: `content-entries`,
				gqlQuery: contentEntriesQuery,
			}).then((res: any) => {
				entry = (res.contentEntries ?? []).find((e: ContentEntry) => e?.slug === slug) ?? null;
			});

			function handleIndex(res: any) {
				groups = res.contentIndex ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: `content-index-${slug}`,
				ttl: CONTENT_CACHE_TTL,
				onStale: handleIndex,
				gqlQuery: contentIndexQuery(slug),
			}).then(handleIndex);
		}
	});
</script>

<svelte:head>
	<title>{entry?.title ?? `Content`} | Kapers Crewe Household</title>
</svelte:head>

<h1><ContentIcon icon={entry?.icon} iconType={entry?.iconType} />{entry?.title ?? $page.params.slug}</h1>
{#if loading}
	<p>Loading...</p>
{:else}
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
							<a href={resolve(`/content/[slug]/[pageSlug]`, { slug: $page.params.slug ?? ``, pageSlug: contentPage?.slug ?? `` })}>{contentPage?.title}</a>
							{#if contentPage?.slug && contentPage.sectionCount}
								{@const readCount = getReadAnchors($page.params.slug ?? ``, contentPage.slug).size}
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
{/if}

<style>
	h1 {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

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
