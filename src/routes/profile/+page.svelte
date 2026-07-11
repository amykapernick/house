<script lang="ts">
	import { clerk, clerkLoaded, isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import Select from '$parts/Select.svelte';

	let clerkContainer: HTMLDivElement | undefined = $state();

	let loading = $state(true);
	let saving = $state(false);
	let saveError = $state('');
	let saved = $state(false);

	let name = $state('');
	let colour = $state('');
	let notionId = $state('');
	let todoistId = $state('');

	let colourOptions = $state<{ value: string; label: string }[]>([]);

	$effect(() => {
		if (!$clerkLoaded || !$clerk || !clerkContainer) return;

		const clerkInstance = $clerk;
		const container = clerkContainer;

		clerkInstance.mountUserProfile(container, {});

		return () => clerkInstance.unmountUserProfile(container);
	});

	$effect(() => {
		if (!$isAuthenticated) return;

		fetchClientData({
			cacheKey: 'profile',
			gqlQuery: `
				query {
					me { slug name colour ids { notion todoist } }
					colours { name }
				}
			`,
		}).then((res) => {
			name = res?.me?.name ?? '';
			colour = res?.me?.colour ?? '';
			notionId = res?.me?.ids?.notion ?? '';
			todoistId = res?.me?.ids?.todoist ?? '';
			colourOptions = (res?.colours ?? []).map((c: { name: string }) => ({ value: c.name, label: c.name }));
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
		setCache('profile', { me: updated, colours: colourOptions.map((o) => ({ name: o.value })) });
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
