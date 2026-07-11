<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { clerk, clerkLoaded, isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import Select from '$parts/Select.svelte';
	import type { PaletteColour } from '$types/schedule';

	let clerkContainer: HTMLDivElement | undefined = $state();

	let loading = $state(true);
	let saving = $state(false);
	let saveError = $state('');
	let saved = $state(false);

	let name = $state('');
	let colour = $state('');
	let notionId = $state('');
	let todoistId = $state('');

	let colours = $state<PaletteColour[]>([]);
	let colourOptions = $derived(colours.map((c) => ({ value: c.name, label: c.name })));

	// Clerk's default UserProfile renders as its own boxed, shadowed card with its
	// own colour scheme - overridden here so it reads as part of this page rather
	// than a distinct embedded widget.
	const clerkAppearance = {
		theme: `simple` as const,
		variables: {
			colorPrimary: `var(--purple_bright)`,
			colorPrimaryForeground: `var(--purple_bright_text)`,
			colorBackground: `transparent`,
			colorForeground: `var(--background_text)`,
			colorNeutral: `var(--neutral)`,
			colorInput: `var(--neutral_light)`,
			colorInputForeground: `var(--neutral_light_text)`,
			fontFamily: `inherit`,
		},
		elements: {
			rootBox: { width: `100%` },
			cardBox: { boxShadow: `none`, border: `none`, backgroundColor: `transparent` },
			card: { boxShadow: `none`, border: `none`, backgroundColor: `transparent`, padding: `0` },
			navbar: { backgroundColor: `transparent`, border: `none` },
			footer: { display: `none` },
		},
	};

	$effect(() => {
		if (!$clerkLoaded || !$clerk || !clerkContainer) return;

		const clerkInstance = $clerk;
		const container = clerkContainer;

		clerkInstance.mountUserProfile(container, { appearance: clerkAppearance });

		return () => clerkInstance.unmountUserProfile(container);
	});

	// Shares the `colours` cache key/query with schedule/+page.svelte's loadColours -
	// same dedup fix for the same underlying issue (the colours collection holds a
	// themeless base row per name plus Light/Dark variants used for CSS theming,
	// which duplicate-keys a Select bound directly to the raw list).
	function loadColours() {
		function handleColours(res: any) {
			const byName = new SvelteMap<string, PaletteColour>();
			for (const c of res.colours ?? []) {
				if (!byName.has(c.name) || !c.theme) byName.set(c.name, c);
			}
			colours = [...byName.values()];
		}
		fetchClientData({
			cacheKey: `colours`,
			onStale: handleColours,
			gqlQuery: `
				query {
					colours {
						name
						hex
						link
						theme
					}
				}
			`,
		}).then(handleColours);
	}

	$effect(() => {
		if (!$isAuthenticated) return;

		loadColours();

		fetchClientData({
			cacheKey: 'profile',
			gqlQuery: `
				query {
					me { slug name colour ids { notion todoist } }
				}
			`,
		}).then((res) => {
			name = res?.me?.name ?? '';
			colour = res?.me?.colour ?? '';
			notionId = res?.me?.ids?.notion ?? '';
			todoistId = res?.me?.ids?.todoist ?? '';
			loading = false;
		});
	});

	function escapeGql(value: string): string {
		return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		saveError = '';
		saved = false;

		const token = await getToken();

		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation {
					updateMe(input: {
						name: "${escapeGql(name)}"
						colour: "${escapeGql(colour)}"
						notionId: "${escapeGql(notionId)}"
						todoistId: "${escapeGql(todoistId)}"
					}) { slug name colour ids { notion todoist } }
				}`,
			}),
		}).then((r) => r.json());

		saving = false;

		if (res?.errors || !res?.data?.updateMe) {
			saveError = 'Could not save your details. Please try again.';
			return;
		}

		const updated = res.data.updateMe;
		name = updated.name ?? '';
		colour = updated.colour ?? '';
		notionId = updated.ids?.notion ?? '';
		todoistId = updated.ids?.todoist ?? '';
		setCache('profile', { me: updated });
		saved = true;
	}
</script>

<svelte:head>
	<title>Profile | Kapers Crewe Household</title>
</svelte:head>

<h1>Profile</h1>

<div class="account" bind:this={clerkContainer}></div>

<h2>Household details</h2>

{#if loading}
	<p>Loading...</p>
{:else}
	<form onsubmit={handleSubmit}>
		<label for="name">Name</label>
		<input id="name" type="text" bind:value={name} required />

		<span class="field-label">Colour</span>
		{#if colourOptions.length}
			<Select
				id="colour"
				label="Colour"
				bind:value={colour}
				options={colourOptions}
			/>
		{/if}

		<label for="notion-id">Notion ID</label>
		<input id="notion-id" type="text" bind:value={notionId} />

		<label for="todoist-id">Todoist ID</label>
		<input id="todoist-id" type="text" bind:value={todoistId} />

		{#if saveError}<p class="error">{saveError}</p>{/if}

		<footer>
			{#if saved}<span class="saved">Saved</span>{/if}
			<button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
		</footer>
	</form>
{/if}

<style>
	.account {
		margin: 1em 0;
	}

	.field-label {
		display: block;
		margin: 0.5em 0 0.1em;
		color: var(--neutral);
		font-weight: 600;
	}

	.saved {
		align-self: center;
		color: var(--success, green);
	}

	.error {
		color: var(--error, red);
	}
</style>
