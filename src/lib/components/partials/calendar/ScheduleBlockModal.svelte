<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import Select from '$parts/Select.svelte';
	import type { PaletteColour } from '$types/schedule';

	let {
		open = $bindable(false),
		mode,
		label = $bindable(''),
		colour = $bindable('purple_bright'),
		colours = [],
		onSave,
		onDelete,
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		label?: string;
		colour?: string;
		colours?: PaletteColour[];
		onSave: () => void;
		onDelete?: () => void;
	} = $props();

	let colourOptions = $derived(colours.map((c) => ({ value: c.name, label: c.name })));
</script>

<Modal bind:open title={mode === `create` ? `New block` : `Edit block`}>
	<label class="field">
		Label
		<input type="text" bind:value={label} placeholder="e.g. Admin tasks" />
	</label>
	<div class="field">
		Colour
		<!-- TODO: Duplicate key purple_bright, don't add light/dark theme colours -->
		<Select id="block-colour" label="Colour" bind:value={colour} options={colourOptions}>
			{#snippet children(option)}
				<span class="swatch" style:background={`var(--${option.value})`}></span>
				<span class="label">{option.label}</span>
			{/snippet}
		</Select>
	</div>

	<div class="actions">
		<button onclick={onSave} disabled={!label.trim()}>{mode === `create` ? `Add` : `Save`}</button>
		<button onclick={() => (open = false)}>Cancel</button>
		{#if mode === `edit` && onDelete}
			<button class="delete" onclick={onDelete}>Delete</button>
		{/if}
	</div>
</Modal>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;
	}

	.swatch {
		display: inline-block;
		width: 0.9em;
		height: 0.9em;
		border-radius: 50%;
		margin-right: 0.5em;
	}

	.actions {
		display: flex;
		gap: 0.5em;
	}

	.delete {
		margin-left: auto;
		color: var(--red);
	}
</style>
