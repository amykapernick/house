<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { saveArticleMutation } from '$utils/content';
	import { getPageTitle } from '$utils/pageTitle';

	// Landing page for the PWA's Web Share Target (see static/manifest.json) -
	// sharing a url from any app's Share menu on Android/desktop, once House is
	// installed, lands here with ?title=&text=&url=. Uses the normal Clerk
	// session like every other page, rather than a bearer secret - unlike the
	// bookmarklet (which runs on an arbitrary third-party page with no Clerk
	// session available), this page is same-origin and already logged in.
	let status = $state<`idle` | `saving` | `error`>(`idle`);
	let attempted = $state(false);

	let url = $derived($page.url.searchParams.get(`url`) ?? ``);
	let title = $derived($page.url.searchParams.get(`title`) ?? ``);
	let excerpt = $derived($page.url.searchParams.get(`text`) ?? ``);

	$effect(() => {
		if (!url || attempted || !$isAuthenticated) return;
		attempted = true;
		status = `saving`;

		fetchClientData({
			gqlQuery: saveArticleMutation(url, title || url, excerpt || undefined),
		}).then((res: any) => {
			if (res?.saveArticle) {
				goto(resolve(`/content/[slug]`, { slug: res.saveArticle }));
			}
			else {
				status = `error`;
			}
		});
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Save Article`)}</title>
</svelte:head>

<h1>Save Article</h1>

{#if !url}
	<p>Share a link to House from your phone or browser's Share menu to save it here.</p>
	<p><a href={resolve(`/content`)}>Back to Content</a></p>
{:else if status === `saving`}
	<p>Saving...</p>
{:else if status === `error`}
	<p class="error">Couldn't save that article. <a href={resolve(`/content`)}>Back to Content</a></p>
{/if}

<style>
	.error {
		color: var(--error);
	}
</style>
