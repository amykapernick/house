<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
	import ColourSelect from '$parts/ColourSelect.svelte';
	import type { PaletteColour } from '$types/schedule';

	let {
		open = $bindable(false),
		mode,
		label = $bindable(''),
		colour = $bindable('purple_bright'),
		colours = [],
		onSave,
		onDelete,
		class: className = '',
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		label?: string;
		colour?: string;
		colours?: PaletteColour[];
		onSave: () => void;
		onDelete?: () => void;
		class?: string;
	} = $props();

	let colourNames = $derived(colours.map((c) => c.name));

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger` },
		...(mode === `edit` && onDelete ? [{ label: `Delete`, onclick: onDelete, style: `secondary`, variant: `danger` } as ModalAction] : []),
		{ label: mode === `create` ? `Add` : `Save`, onclick: onSave, variant: `success`, disabled: !label.trim() },
	]);
</script>

<Modal bind:open class={className} title={mode === `create` ? `New block` : `Edit block`} actions={modalActions}>
	<div class="field">
		<label for="block-label">Label</label>
		<input type="text" id="block-label" bind:value={label} placeholder="e.g. Admin tasks" />
	</div>
	<div class="field">
		Colour
		<ColourSelect id="block-colour" bind:value={colour} colours={colourNames} />
	</div>
</Modal>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;
	}
</style>
