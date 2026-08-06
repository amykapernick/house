<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import ColourSelect from '$parts/ColourSelect/index.svelte';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		mode,
		id,
		entityLabel = null,
		startX = $bindable(0),
		startY = $bindable(0),
		sizeWidth = $bindable(100),
		sizeHeight = $bindable(100),
		colour = $bindable(``),
		colourOptions,
		saving = false,
		error = ``,
		onSave,
		onDelete,
		class: className = '',
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		id: string;
		entityLabel?: string | null;
		startX?: number;
		startY?: number;
		sizeWidth?: number;
		sizeHeight?: number;
		colour?: string;
		colourOptions: string[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
		onDelete?: () => void;
		class?: string;
	} = $props();

	let modalTitle = $derived(mode === `create` ? `Add area` : `Edit area`);

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		...(mode === `edit` && onDelete ? [{ label: `Delete`, onclick: onDelete, style: `secondary`, variant: `danger`, disabled: saving } as ModalAction] : []),
		{ label: saving ? `Saving…` : mode === `create` ? `Add` : `Save`, onclick: onSave, variant: `success`, disabled: saving },
	]);
</script>

<Modal bind:open class={className} title={modalTitle} actions={modalActions}>
	{#if mode === `create`}
		<p class={styles.entity_label}>{entityLabel ?? id}</p>
	{/if}

	<div class={styles['field-row']}>
		<div class={styles.field}>
			<label for="house-area-x">X</label>
			<input type="number" id="house-area-x" bind:value={startX} />
		</div>
		<div class={styles.field}>
			<label for="house-area-y">Y</label>
			<input type="number" id="house-area-y" bind:value={startY} />
		</div>
	</div>

	<div class={styles['field-row']}>
		<div class={styles.field}>
			<label for="house-area-width">Width</label>
			<input type="number" id="house-area-width" bind:value={sizeWidth} min="1" />
		</div>
		<div class={styles.field}>
			<label for="house-area-height">Height</label>
			<input type="number" id="house-area-height" bind:value={sizeHeight} min="1" />
		</div>
	</div>

	<div class={styles.field}>
		Colour
		<ColourSelect id="house-area-colour" bind:value={colour} colours={colourOptions} includeNone />
	</div>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
