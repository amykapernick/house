<script lang="ts">
	import { onDestroy, tick } from 'svelte';
	import { BrowserMultiFormatReader } from '@zxing/browser';
	import type { IScannerControls } from '@zxing/browser';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		isbn = $bindable(``),
		name = $bindable(``),
		author = $bindable(``),
		series = $bindable(``),
		seriesNumber = $bindable(``),
		thumbnail = $bindable(``),
		saving = false,
		error = ``,
		onSave,
	}: {
		open?: boolean;
		isbn?: string;
		name?: string;
		author?: string;
		series?: string;
		seriesNumber?: string;
		thumbnail?: string;
		saving?: boolean;
		error?: string;
		onSave: () => void;
	} = $props();

	let scanning = $state(false);
	let scanError = $state(``);
	let videoEl: HTMLVideoElement | undefined = $state();
	let scannerControls: IScannerControls | undefined;

	let lookupLoading = $state(false);
	let lookupError = $state(``);
	let lastLookedUpIsbn = ``;

	let valid = $derived(isbn.trim().length > 0 && name.trim().length > 0);

	function stopScan() {
		scannerControls?.stop();
		scannerControls = undefined;
		scanning = false;
	}

	async function startScan() {
		scanError = ``;
		scanning = true;
		await tick();

		try {
			const reader = new BrowserMultiFormatReader();
			// EAN-13 (what ISBN-13 barcodes are printed as) is in the default
			// format set, so no explicit hints/possibleFormats are needed here.
			scannerControls = await reader.decodeFromVideoDevice(undefined, videoEl, (result) => {
				if (!result) return;
				isbn = result.getText();
				stopScan();
			});
		}
		catch {
			scanError = `Camera unavailable - enter the ISBN manually instead.`;
			scanning = false;
		}
	}

	// Open Library returns author *keys*, not names - one follow-up request per
	// author resolves the display name.
	async function lookupAuthorNames(keys: string[]): Promise<string[]> {
		const names = await Promise.all(
			keys.map((key) =>
				fetch(`https://openlibrary.org${key}.json`)
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => data?.name as string | undefined)
					.catch(() => undefined)
			)
		);

		return names.filter((foundName): foundName is string => Boolean(foundName));
	}

	async function lookupIsbn(rawIsbn: string) {
		const cleaned = rawIsbn.replace(/[^0-9Xx]/g, ``);
		if (cleaned.length !== 10 && cleaned.length !== 13) return;
		if (cleaned === lastLookedUpIsbn) return;
		lastLookedUpIsbn = cleaned;

		lookupLoading = true;
		lookupError = ``;

		try {
			const res = await fetch(`https://openlibrary.org/isbn/${cleaned}.json`);
			if (!res.ok) throw new Error(`Not found`);
			const data = await res.json();

			// Prefilled, but every field stays editable below - Open Library data
			// quality varies, and existing values (already typed, or from a
			// previous scan attempt) are never clobbered.
			if (!name && data.title) name = data.title;
			if (!series && data.series?.[0]) series = String(data.series[0]);

			const authorKeys = (data.authors ?? []).map((a: any) => a.key).filter(Boolean);
			if (!author && authorKeys.length) {
				const names = await lookupAuthorNames(authorKeys);
				if (names.length) author = names.join(`, `);
			}

			// Deterministic cover URL - no extra request needed to know it exists.
			if (!thumbnail) thumbnail = `https://covers.openlibrary.org/b/isbn/${cleaned}-M.jpg`;
		}
		catch {
			lookupError = `Couldn't find that ISBN - fill the details in manually.`;
		}
		finally {
			lookupLoading = false;
		}
	}

	$effect(() => {
		lookupIsbn(isbn);
	});

	onDestroy(() => stopScan());

	let modalActions: ModalAction[] = $derived([
		{
			label: `Cancel`,
			onclick: () => {
				stopScan();
				open = false;
			},
			style: `secondary`,
			variant: `danger`,
			disabled: saving,
		},
		{
			label: saving ? `Saving…` : `Add`,
			onclick: onSave,
			variant: `success`,
			disabled: !valid || saving,
		},
	]);
</script>

<Modal
	bind:open
	title="Add book"
	actions={modalActions}
>
	<div class={styles.field}>
		<label for="add-book-isbn">ISBN</label>
		<div class={styles['isbn-row']}>
			<input
				id="add-book-isbn"
				type="text"
				inputmode="numeric"
				placeholder="e.g. 9780261102217"
				bind:value={isbn}
				disabled={saving}
			/>
			<button
				type="button"
				onclick={scanning ? stopScan : startScan}
				disabled={saving}
			>{scanning ? `Stop` : `Scan barcode`}</button>
		</div>
		{#if scanning}
			<video
				bind:this={videoEl}
				class={styles.scanner}
				muted
				playsinline
			></video>
		{/if}
		{#if scanError}<p class="{styles.hint} {styles.error}">{scanError}</p>{/if}
		{#if lookupLoading}<p class={styles.hint}>Looking up ISBN…</p>{/if}
		{#if lookupError}<p class={styles.hint}>{lookupError}</p>{/if}
	</div>

	<div class={styles.field}>
		<label for="add-book-name">Title</label>
		<input
			id="add-book-name"
			type="text"
			bind:value={name}
			disabled={saving}
		/>
	</div>

	<div class={styles.field}>
		<label for="add-book-author">Author(s)</label>
		<input
			id="add-book-author"
			type="text"
			placeholder="Comma-separated"
			bind:value={author}
			disabled={saving}
		/>
	</div>

	<div class={styles['field-row']}>
		<div class={styles.field}>
			<label for="add-book-series">Series</label>
			<input
				id="add-book-series"
				type="text"
				bind:value={series}
				disabled={saving}
			/>
		</div>
		<div class={styles.field}>
			<label for="add-book-series-number">Series #</label>
			<input
				id="add-book-series-number"
				type="number"
				bind:value={seriesNumber}
				disabled={saving}
			/>
		</div>
	</div>

	{#if thumbnail}
		<img
			class={styles.thumbnail}
			src={thumbnail}
			alt=""
		/>
	{/if}

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
