<script lang="ts">
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { PaletteColour } from '$types/generated';
	import { getPageTitle } from '$utils/pageTitle';

	let colours = $state<PaletteColour[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const standard = $derived(colours.filter((c) => !c.theme));
	const light = $derived(colours.filter((c) => c.theme === `Light`));
	const dark = $derived(colours.filter((c) => c.theme === `Dark`));

	async function load() {
		try {
			const res = await fetch(getGraphqlUrl(), {
				method: `POST`,
				headers: { 'Content-Type': `application/json` },
				body: JSON.stringify({ query: `query { colours { name hex link theme text { name hex } } }` }),
			}).then((r) => r.json());

			if (res?.errors) {
				error = res.errors.map((e: { message: string }) => e.message).join(`, `);
				return;
			}

			colours = res?.data?.colours ?? [];
		}
		catch (err) {
			error = err instanceof Error ? err.message : `Failed to reach the API`;
		}
		finally {
			loading = false;
		}
	}

	if (import.meta.env.DEV) load();
</script>

<svelte:head>
	<title>{getPageTitle(`Colours`)}</title>
</svelte:head>

{#if !import.meta.env.DEV}
	<p>The colour list is only available when running the app locally.</p>
{:else}
	<h1>Colours</h1>
	<p class="subtitle">Every colour record from the GraphQL <code>colours</code> query - the source data behind <code>colours.generated.css</code>.</p>

	{#snippet colourList(list: PaletteColour[], prefix: string)}
		<ul class="colours">
			{#each list as colour}
				<li style={
					`--colour_background_text: var(--${prefix}${colour.name}_text); --colour_background: var(--${prefix}${colour.name});`
				}>
					<span class="name">{colour.name}</span>
					{#if colour.hex}{colour.hex}{:else}links to <code>{colour.link}</code>{/if}
				</li>
			{/each}
		</ul>
	{/snippet}

	{#if loading}
		<p>Loading colours...</p>
	{:else if error}
		<p class="error">Failed to load colours: {error}</p>
	{:else}
		<section class="standard">
			<h2>Standard</h2>
			{@render colourList(standard, ``)}
		</section>

		<section>
			<h2>Light theme</h2>
			{@render colourList(light, `light_`)}
		</section>

		<section>
			<h2>Dark theme</h2>
			{@render colourList(dark, `dark_`)}
		</section>
	{/if}
{/if}

<style>
	@import '@mixins';

	.subtitle {
		max-width: 40em;
		color: var(--grey);
	}

	.error {
		color: var(--red);
	}

	.colours {
		display: grid;
		grid-template-columns: repeat(auto-fit, 120px);
		gap: 0.5em;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.5em;
			background: var(--colour_background);
			color: var(--colour_background_text);
		}
	}

	.name {
		font-weight: 600;
	}
</style>
