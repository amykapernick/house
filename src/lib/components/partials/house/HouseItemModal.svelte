<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import Select from '$parts/Select.svelte';

	const ITEM_TYPE_OPTIONS = [
		{ value: `aircon`, label: `Aircon` },
		{ value: `alarm`, label: `Alarm` },
		{ value: `bed`, label: `Bed` },
		{ value: `camera`, label: `Camera` },
		{ value: `computer`, label: `Computer` },
		{ value: `doorbell`, label: `Doorbell` },
		{ value: `fan`, label: `Fan` },
		{ value: `fan_light`, label: `Fan + Light` },
		{ value: `fan_pedestol`, label: `Pedestal Fan` },
		{ value: `fire`, label: `Fire` },
		{ value: `fridge`, label: `Fridge` },
		{ value: `lamp`, label: `Lamp` },
		{ value: `laptop`, label: `Laptop` },
		{ value: `light`, label: `Light` },
		{ value: `light_switch`, label: `Light Switch` },
		{ value: `monitor`, label: `Monitor` },
		{ value: `oven`, label: `Oven` },
		{ value: `pi`, label: `Raspberry Pi` },
		{ value: `robot_vacuum`, label: `Robot Vacuum` },
		{ value: `speaker`, label: `Speaker` },
		{ value: `tv`, label: `TV` },
		{ value: `washing_machine`, label: `Washing Machine` },
		{ value: `wifi_router`, label: `WiFi Router` },
	];

	let {
		open = $bindable(false),
		mode,
		id,
		entityLabel = null,
		type = $bindable(`light`),
		area = $bindable(``),
		startX = $bindable(0),
		startY = $bindable(0),
		rotation = $bindable(0),
		linkedItemLabel = null,
		areaOptions,
		saving = false,
		error = ``,
		onSave,
		onDelete,
	}: {
		open?: boolean;
		mode: `create` | `edit`;
		id: string;
		entityLabel?: string | null;
		type?: string;
		area?: string;
		startX?: number;
		startY?: number;
		rotation?: number;
		linkedItemLabel?: string | null;
		areaOptions: { value: string; label: string }[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
		onDelete?: () => void;
	} = $props();

	let modalTitle = $derived(mode === `create` ? `Add item` : `Edit item`);
	let valid = $derived(!!type);

	let areaSelectOptions = $derived([{ value: ``, label: `Unassigned` }, ...areaOptions]);
</script>

<Modal bind:open title={modalTitle}>
	{#if mode === `create`}
		<p class="entity_label">{entityLabel ?? id}</p>
	{/if}

	<div class="field">
		Type
		<Select id="house-item-type" label="Type" bind:value={type} options={ITEM_TYPE_OPTIONS} />
	</div>

	<div class="field">
		Area
		<Select id="house-item-area" label="Area" bind:value={area} options={areaSelectOptions} />
	</div>

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

	<label class="field">
		Rotation
		<input type="number" bind:value={rotation} />
	</label>

	{#if linkedItemLabel}
		<p class="linked">Linked to: {linkedItemLabel}</p>
	{/if}

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<button onclick={onSave} disabled={!valid || saving}>
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

	.linked {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.9em;
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
