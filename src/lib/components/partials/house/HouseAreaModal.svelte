<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import ColourSelect from '$parts/ColourSelect.svelte';

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
</script>

<Modal bind:open class={className} title={modalTitle}>
	{#if mode === `create`}
		<p class="entity_label">{entityLabel ?? id}</p>
	{/if}

	<div class="field-row">
		<div class="field">
			<label for="house-area-x">X</label>
			<input type="number" id="house-area-x" bind:value={startX} />
		</div>
		<div class="field">
			<label for="house-area-y">Y</label>
			<input type="number" id="house-area-y" bind:value={startY} />
		</div>
	</div>

	<div class="field-row">
		<div class="field">
			<label for="house-area-width">Width</label>
			<input type="number" id="house-area-width" bind:value={sizeWidth} min="1" />
		</div>
		<div class="field">
			<label for="house-area-height">Height</label>
			<input type="number" id="house-area-height" bind:value={sizeHeight} min="1" />
		</div>
	</div>

	<div class="field">
		Colour
		<ColourSelect id="house-area-colour" bind:value={colour} colours={colourOptions} includeNone />
	</div>

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<button onclick={onSave} disabled={saving}>
			{saving ? `Saving…` : mode === `create` ? `Add` : `Save`}
		</button>
		<button onclick={() => (open = false)} disabled={saving}>Cancel</button>
		{#if mode === `edit` && onDelete}
			<button class="delete" onclick={onDelete} disabled={saving}>Delete</button>
		{/if}
	</div>
</Modal>

<style>
	@import '@mixins';

	.entity_label {
		margin: 0 0 1em;
		font-weight: 600;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;
	}

	.field-row {
		display: flex;
		gap: 1em;

		& .field {
			flex: 1;
		}
	}

	.error {
		color: var(--red);
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
