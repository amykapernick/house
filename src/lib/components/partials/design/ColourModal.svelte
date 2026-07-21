<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
	import ColourSelect from '$parts/ColourSelect.svelte';

	let {
		open = $bindable(false),
		mode,
		name = $bindable(``),
		hex = $bindable<string | null>(null),
		link = $bindable(``),
		neutral = $bindable(false),
		linkOptions,
		saving = false,
		error = ``,
		onSave,
		onDelete,
		class: className = '',
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		name?: string;
		hex?: string | null;
		link?: string;
		neutral?: boolean;
		linkOptions: string[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
		onDelete?: () => void;
		class?: string;
	} = $props();

	let modalTitle = $derived(mode === `create` ? `Add colour` : `Edit colour`);
	let valid = $derived(!!name && (!!hex || !!link));

	function setHex(value: string) {
		hex = value || null;
		if (value) link = ``;
	}

	// ColourSelect binds `link` directly (its own onchange only forwards the raw
	// DOM event, not the picked value) - clearing hex here instead keeps the two
	// fields mutually exclusive regardless of which one the user touches.
	$effect(() => {
		if (link) hex = null;
	});

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		...(mode === `edit` && onDelete ? [{ label: `Delete`, onclick: onDelete, style: `secondary`, variant: `danger`, disabled: saving } as ModalAction] : []),
		{ label: saving ? `Saving…` : mode === `create` ? `Add` : `Save`, onclick: onSave, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal bind:open class={className} title={modalTitle} actions={modalActions}>
	<div class="field">
		<label for="colour-name">Name</label>
		<input id="colour-name" type="text" bind:value={name} />
	</div>

	<div class="field">
		<span class="field-label">Value</span>
		<div class="value-row">
			<input type="color" aria-label="{name || `Colour`} hex value" value={hex ?? `#000000`} oninput={(e) => setHex(e.currentTarget.value)} />
			<input type="text" aria-label="{name || `Colour`} hex code" placeholder="hex" value={hex ?? ``} oninput={(e) => setHex(e.currentTarget.value)} />
		</div>
	</div>

	<div class="field">
		<span class="field-label">Or link to another colour</span>
		<ColourSelect id="colour-link" bind:value={link} colours={linkOptions} includeNone noneLabel="No link" />
	</div>

	<div class="field checkbox-field">
		<input type="checkbox" id="colour-neutral" bind:checked={neutral} />
		<label for="colour-neutral">Neutral</label>
	</div>

	{#if error}<p class="error">{error}</p>{/if}
</Modal>

<style>
	@import '@mixins';

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;
	}

	.field-label {
		font-size: 0.9em;
	}

	.value-row {
		display: flex;
		align-items: center;
		gap: 0.5em;

		& input[type='text'] {
			width: 8em;
		}
	}

	.checkbox-field {
		flex-direction: row;
		align-items: center;
		gap: 0.4em;
	}

	.error {
		color: var(--red);
	}
</style>
