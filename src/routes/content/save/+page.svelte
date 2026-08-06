<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { saveArticleMutation } from '$utils/content';
	import { importRecipeMutation } from '$utils/recipes';
	import { getPageTitle } from '$utils/pageTitle';

	// Landing page for the PWA's Web Share Target (see static/manifest.json) -
	// sharing a url from any app's Share menu on Android/desktop, once House is
	// installed, lands here with ?title=&text=&url=. Uses the normal Clerk
	// session like every other page, rather than a bearer secret - unlike the
	// bookmarklet (which runs on an arbitrary third-party page with no Clerk
	// session available), this page is same-origin and already logged in.
	//
	// A PWA can only register a single share_target action, so this page has
	// to handle every kind of shared link - the user picks what to do with it
	// rather than us guessing, since a shared recipe page and a shared article
	// both arrive with the exact same url/title/text shape.
	let saving = $state(false);
	let errorType = $state<`article` | `recipe` | null>(null);

	let url = $derived($page.url.searchParams.get(`url`) ?? ``);
	let title = $derived($page.url.searchParams.get(`title`) ?? ``);
	let excerpt = $derived($page.url.searchParams.get(`text`) ?? ``);

	async function saveAsArticle() {
		saving = true;
		errorType = null;

		const res = await fetchClientData({
			gqlQuery: saveArticleMutation(url, title || url, excerpt || undefined),
		});
		saving = false;

		if (res?.saveArticle) {
			goto(resolve(`/content/[slug]`, { slug: res.saveArticle }));
		}
		else {
			errorType = `article`;
		}
	}

	async function importAsRecipe() {
		saving = true;
		errorType = null;

		const res = await fetchClientData({ gqlQuery: importRecipeMutation(url) });
		saving = false;

		const slug = res?.importRecipe?.slug;
		if (slug) {
			goto(resolve(`/recipes/[slug]`, { slug }));
		}
		else {
			errorType = `recipe`;
		}
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Save Shared Link`)}</title>
</svelte:head>

<h1>Save Shared Link</h1>

{#if !url}
	<p>Share a link to House from your phone or browser's Share menu to save it here.</p>
	<p><a href={resolve(`/content`)}>Back to Content</a></p>
{:else}
	<p class="shared-title">{title || url}</p>
	{#if title && title !== url}<p class="shared-url">{url}</p>{/if}

	<div class="choices">
		<button type="button" onclick={saveAsArticle} disabled={saving || !$isAuthenticated}>
			{saving ? `Saving…` : `Save as article`}
		</button>
		<button type="button" onclick={importAsRecipe} disabled={saving || !$isAuthenticated}>
			{saving ? `Importing…` : `Import as recipe`}
		</button>
	</div>

	{#if errorType === `article`}
		<p class="error">Couldn't save that article - check your connection and try again, or import it as a recipe instead.</p>
	{:else if errorType === `recipe`}
		<p class="error">Couldn't import that recipe - check the URL and try again, or save it as an article instead.</p>
	{/if}
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	.shared-title {
		margin-bottom: 0.2em;
		font-weight: 600;
	}

	.shared-url {
		margin-top: 0;
		overflow-wrap: break-word;
		color: var(--grey);
		font-size: 0.85em;
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-top: 1em;
	}

	.error {
		color: var(--error);
	}
</style>
