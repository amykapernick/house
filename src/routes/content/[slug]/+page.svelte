<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { POSSUMS_CACHE_TTL, possumsIndexQuery } from '$utils/possums';
	import type { PossumsGroup } from '$types/generated';

	let groups = $state<PossumsGroup[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleIndex(res: any) {
				groups = res.possumsIndex ?? [];
				loading = false;
			}
			fetchClientData({
				cacheKey: `possums-index`,
				ttl: POSSUMS_CACHE_TTL,
				onStale: handleIndex,
				gqlQuery: possumsIndexQuery,
			}).then(handleIndex);
		}
	});
</script>

<svelte:head>
	<title>Possums | Kapers Crewe Household</title>
</svelte:head>

<h1>Possums</h1>
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
					{#each group.courses ?? [] as course (course?.slug)}
						<li>
							<a href={resolve(`/content/possums/[slug]`, { slug: course?.slug ?? `` })}>{course?.title}</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

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
	}
</style>
