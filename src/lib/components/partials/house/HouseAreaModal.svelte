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
	} = $props();

	let modalTitle = $derived(mode === `create` ? `Add area` : `Edit area`);
</script>

<Modal bind:open title={modalTitle}>
	{#if mode === `create`}
		<p class="entity_label">{entityLabel ?? id}</p>
	{/if}

	<div class="field-row">
		<label class="field">
			X
			<input type="number" bind:value={startX} />
		</label>
		<label class="field">
			Y
			<input type="number" bind:value={startY} />
		</label>
	</div>

	<div class="field-row">
		<label class="field">
			Width
			<input type="number" bind:value={sizeWidth} min="1" />
		</label>
		<label class="field">
			Height
			<input type="number" bind:value={sizeHeight} min="1" />
		</label>
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
