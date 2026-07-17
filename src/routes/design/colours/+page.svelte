<script lang="ts">
	import { onDestroy } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import Colours from '$partials/design/Colours.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl, clearCache } from '$utils/fetchClientData';
	import buildColoursCss from '$styles/config/buildColoursCss.js';
	import type { EditableColour } from '$types/colour';
	import { getPageTitle } from '$utils/pageTitle';

	let colours = $state<EditableColour[]>([]);
	let loading = $state(true);

	const COLOURS_QUERY = `
		query {
			colours {
				id
				name
				hex
				link
				theme
				neutral
				text { name hex }
			}
		}
	`;

	function handleColours(res: any) {
		colours = (res.colours ?? []).map((c: any) => ({ ...c, neutral: Boolean(c.neutral) }));
		loading = false;
	}

	function load(skipCache = false) {
		fetchClientData({
			cacheKey: `colours-design`,
			skipCache,
			onStale: handleColours,
			gqlQuery: COLOURS_QUERY,
		}).then(handleColours);
	}

	$effect(() => {
		if ($isAuthenticated) load();
	});

	// Editing - editableStandard/Light/Dark are the working copies fed to the
	// three theme sections; they track the server-truth `colours` groupings
	// until the user starts changing them. Colours never move between
	// sections, so each is diffed against its own theme bucket independently.
	const standard = $derived(colours.filter((c) => !c.theme));
	const light = $derived(colours.filter((c) => c.theme === `Light`));
	const dark = $derived(colours.filter((c) => c.theme === `Dark`));

	function cloneColours(items: EditableColour[]): EditableColour[] {
		return items.map((c) => ({ ...c, text: c.text ? { ...c.text } : null }));
	}

	let editableStandard = $state<EditableColour[]>([]);
	let editableLight = $state<EditableColour[]>([]);
	let editableDark = $state<EditableColour[]>([]);
	let editing = $state(false);
	let dirty = $state(false);
	let saving = $state(false);
	let saveError = $state('');

	$effect(() => {
		editableStandard = cloneColours(standard);
		editableLight = cloneColours(light);
		editableDark = cloneColours(dark);
		dirty = false;
	});

	function startEditing() {
		saveError = '';
		editing = true;
	}

	function discard() {
		if (dirty && !confirm('Discard unsaved colour changes?')) return;
		editableStandard = cloneColours(standard);
		editableLight = cloneColours(light);
		editableDark = cloneColours(dark);
		dirty = false;
		saveError = '';
		editing = false;
	}

	const gqlStr = (value?: string | null) => JSON.stringify(value ?? '');
	const gqlBool = (value?: boolean | null) => (value ? 'true' : 'false');

	function colourInputGql(item: EditableColour): string {
		return `{ name: ${gqlStr(item.name)}, hex: ${item.hex ? gqlStr(item.hex) : `null`}, link: ${item.link ? gqlStr(item.link) : `null`}, theme: ${gqlStr(item.theme ?? '')}, neutral: ${gqlBool(item.neutral)} }`;
	}

	function colourChanged(a: EditableColour, b: EditableColour): boolean {
		return (
			(a.name ?? '') !== (b.name ?? '')
			|| (a.hex ?? '') !== (b.hex ?? '')
			|| (a.link ?? '') !== (b.link ?? '')
			|| (a.theme ?? '') !== (b.theme ?? '')
			|| !!a.neutral !== !!b.neutral
		);
	}

	function diffColours(original: EditableColour[], edited: EditableColour[], ops: string[], startCount: number): number {
		let opCount = startCount;
		const originalById = new Map(original.map((c) => [c.id, c]));
		const editedIds = new Set(edited.map((c) => c.id));

		for (const item of edited) {
			const orig = originalById.get(item.id);
			if (!orig) ops.push(`op${opCount++}: createColour(input: ${colourInputGql(item)}) { success }`);
			else if (colourChanged(orig, item)) ops.push(`op${opCount++}: updateColour(id: ${gqlStr(item.id)}, input: ${colourInputGql(item)}) { success }`);
		}
		for (const item of original) {
			if (!editedIds.has(item.id)) ops.push(`op${opCount++}: deleteColour(id: ${gqlStr(item.id)}) { success }`);
		}

		return opCount;
	}

	async function handleSave() {
		saving = true;
		saveError = '';

		const ops: string[] = [];
		let opCount = 0;
		opCount = diffColours(standard, editableStandard, ops, opCount);
		opCount = diffColours(light, editableLight, ops, opCount);
		opCount = diffColours(dark, editableDark, ops, opCount);

		if (!ops.length) {
			editing = false;
			saving = false;
			return;
		}

		try {
			const token = await getToken();
			const res = await fetch(getGraphqlUrl(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ query: `mutation {\n${ops.join('\n')}\n}` }),
			}).then((r) => r.json());

			const results = Object.values(res?.data ?? {}) as { success?: boolean }[];
			if (res?.errors || !results.length || results.some((r) => !r?.success)) {
				throw new Error('Failed to save colour changes');
			}

			editing = false;
			clearCache('colours');
			clearCache('colours-base');
			load(true);
		}
		catch {
			saveError = 'Failed to save some changes - please try again.';
		}
		finally {
			saving = false;
		}
	}

	beforeNavigate(({ cancel }) => {
		if (dirty && !confirm('Discard unsaved colour changes?')) cancel();
	});

	$effect(() => {
		if (!dirty) return;

		function handler(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	// Live preview - while editing, reflect the working copy's colours as real
	// CSS custom properties straight away (rather than waiting for the actual
	// rebuild the save triggers), by reusing the exact same buildColoursCss
	// that generates the production stylesheet. text pairing isn't
	// recomputed here (that needs household_api's contrast logic) - existing
	// records keep whatever text buildColoursCss last got from the server,
	// new ones simply get no _text line, which it already handles gracefully.
	let previewStyleEl: HTMLStyleElement | undefined;

	$effect(() => {
		if (!editing) {
			previewStyleEl?.remove();
			previewStyleEl = undefined;
			return;
		}

		const allEditable = [...editableStandard, ...editableLight, ...editableDark];
		const css = buildColoursCss(allEditable);

		if (!previewStyleEl) {
			previewStyleEl = document.createElement('style');
			previewStyleEl.id = 'live-colours-preview';
			document.head.appendChild(previewStyleEl);
		}
		previewStyleEl.textContent = css;
	});

	onDestroy(() => previewStyleEl?.remove());
</script>

<svelte:head>
	<title>{getPageTitle(`Colours`)}</title>
</svelte:head>

<h1>Colours</h1>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<div class="colours-toolbar">
		{#if editing}
			{#if dirty}<span class="unsaved">Unsaved changes</span>{/if}
			<button type="button" onclick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
			<button type="button" onclick={discard} disabled={saving}>Discard</button>
			{#if saveError}<span class="error">{saveError}</span>{/if}
		{:else}
			<button type="button" onclick={startEditing}>Edit</button>
		{/if}
	</div>

	<h2>Standard</h2>
	<Colours bind:colours={editableStandard} theme="" {editing} onChange={() => (dirty = true)} />

	<h2>Light theme</h2>
	<Colours bind:colours={editableLight} theme="Light" {editing} onChange={() => (dirty = true)} />

	<h2>Dark theme</h2>
	<Colours bind:colours={editableDark} theme="Dark" {editing} onChange={() => (dirty = true)} />
{/if}

<style>
	.colours-toolbar {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 1em;
	}

	.unsaved {
		color: var(--orange);
	}

	.error {
		color: var(--red);
	}
</style>
