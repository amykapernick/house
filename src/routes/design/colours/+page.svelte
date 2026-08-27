<script lang="ts">
	import { onDestroy } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import Colours from '$partials/design/Colours/index.svelte';
	import ColourModal from '$partials/design/ColourModal/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl, clearCache } from '$utils/fetchClientData';
	import buildColoursCss from '$styles/config/buildColoursCss.js';
	import type { EditableColour } from '$types/colour';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';

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

	// Colour modal - shared between "add" and "edit", same as the house map's
	// item/area modals. Saving/deleting mutates the relevant theme's working
	// copy array directly; nothing reaches the API until the page-level Save.
	let colourModalOpen = $state(false);
	let colourModalMode = $state<`create` | `edit`>(`create`);
	let colourModalTheme = $state('');
	let colourModalId = $state('');
	let colourModalName = $state('');
	let colourModalHex = $state<string | null>('#000000');
	let colourModalLink = $state('');
	let colourModalNeutral = $state(false);

	function sectionArray(theme: string) {
		return theme === `Light` ? editableLight : theme === `Dark` ? editableDark : editableStandard;
	}

	function setSectionArray(theme: string, items: EditableColour[]) {
		if (theme === `Light`) editableLight = items;
		else if (theme === `Dark`) editableDark = items;
		else editableStandard = items;
	}

	let colourModalLinkOptions = $derived(
		sectionArray(colourModalTheme)
			.filter((c) => c.id !== colourModalId)
			.map((c) => c.name)
	);

	function openAddColourModal(theme: string) {
		colourModalMode = `create`;
		colourModalTheme = theme;
		colourModalId = crypto.randomUUID();
		colourModalName = '';
		colourModalHex = '#000000';
		colourModalLink = '';
		colourModalNeutral = false;
		colourModalOpen = true;
	}

	function openEditColourModal(theme: string, id: string) {
		const item = sectionArray(theme).find((c) => c.id === id);
		if (!item) return;
		colourModalMode = `edit`;
		colourModalTheme = theme;
		colourModalId = item.id;
		colourModalName = item.name;
		colourModalHex = item.hex;
		colourModalLink = item.link ?? '';
		colourModalNeutral = item.neutral;
		colourModalOpen = true;
	}

	function saveColourModal() {
		const arr = sectionArray(colourModalTheme);

		if (colourModalMode === `create`) {
			setSectionArray(colourModalTheme, [
				...arr,
				{
					id: colourModalId,
					name: colourModalName,
					hex: colourModalHex,
					link: colourModalLink || null,
					theme: colourModalTheme || null,
					neutral: colourModalNeutral,
					text: null,
				},
			]);
		}
		else {
			setSectionArray(
				colourModalTheme,
				arr.map((c) =>
					c.id === colourModalId
						? { ...c, name: colourModalName, hex: colourModalHex, link: colourModalLink || null, neutral: colourModalNeutral }
						: c
				)
			);
		}

		dirty = true;
		colourModalOpen = false;
	}

	function deleteColourFromModal() {
		setSectionArray(colourModalTheme, sectionArray(colourModalTheme).filter((c) => c.id !== colourModalId));
		dirty = true;
		colourModalOpen = false;
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

<Title>Colours</Title>
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
	<Colours colours={editableStandard} theme="" {editing} onEdit={(id) => openEditColourModal('', id)} onAdd={() => openAddColourModal('')} />

	<h2>Light theme</h2>
	<Colours colours={editableLight} theme="Light" {editing} onEdit={(id) => openEditColourModal('Light', id)} onAdd={() => openAddColourModal('Light')} />

	<h2>Dark theme</h2>
	<Colours colours={editableDark} theme="Dark" {editing} onEdit={(id) => openEditColourModal('Dark', id)} onAdd={() => openAddColourModal('Dark')} />

	<ColourModal
		bind:open={colourModalOpen}
		mode={colourModalMode}
		bind:name={colourModalName}
		bind:hex={colourModalHex}
		bind:link={colourModalLink}
		bind:neutral={colourModalNeutral}
		linkOptions={colourModalLinkOptions}
		onSave={saveColourModal}
		onDelete={colourModalMode === `edit` ? deleteColourFromModal : undefined}
	/>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
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
