<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
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
		linkedItem = $bindable(``),
		linkOptions,
		areaOptions,
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
		type?: string;
		area?: string;
		startX?: number;
		startY?: number;
		rotation?: number;
		linkedItem?: string;
		linkOptions: { value: string; label: string }[];
		areaOptions: { value: string; label: string }[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
		onDelete?: () => void;
		class?: string;
	} = $props();

	let modalTitle = $derived(mode === `create` ? `Add item` : `Edit item`);
	let valid = $derived(!!type);

	let areaSelectOptions = $derived([{ value: ``, label: `Unassigned` }, ...areaOptions]);
	let linkSelectOptions = $derived([{ value: ``, label: `None` }, ...linkOptions]);

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		...(mode === `edit` && onDelete ? [{ label: `Delete`, onclick: onDelete, style: `secondary`, variant: `danger`, disabled: saving } as ModalAction] : []),
		{ label: saving ? `Saving…` : mode === `create` ? `Add` : `Save`, onclick: onSave, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal bind:open class={className} title={modalTitle} actions={modalActions}>
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
		<div class="field">
			<label for="house-item-x">X</label>
			<input type="number" id="house-item-x" bind:value={startX} />
		</div>
		<div class="field">
			<label for="house-item-y">Y</label>
			<input type="number" id="house-item-y" bind:value={startY} />
		</div>
	</div>

	<div class="field">
		<label for="house-item-rotation">Rotation</label>
		<input type="number" id="house-item-rotation" bind:value={rotation} />
	</div>

	<div class="field">
		Link to another item
		<Select id="house-item-linked" label="Link to another item" bind:value={linkedItem} options={linkSelectOptions} />
	</div>

	{#if error}<p class="error">{error}</p>{/if}
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
</style>
