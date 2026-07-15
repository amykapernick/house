<script lang="ts">
	import Modal from '$parts/Modal.svelte';
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
</script>

<Modal bind:open class={className} title={mode === `create` ? `New block` : `Edit block`}>
	<label class="field">
		Label
		<input type="text" bind:value={label} placeholder="e.g. Admin tasks" />
	</label>
	<div class="field">
		Colour
		<ColourSelect id="block-colour" bind:value={colour} colours={colourNames} />
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

	.actions {
		display: flex;
		gap: 0.5em;
	}

	.delete {
		margin-left: auto;
		color: var(--red);
	}
</style>
