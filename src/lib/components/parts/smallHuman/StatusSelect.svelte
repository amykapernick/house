<script
	lang="ts"
	generics="Status extends IconName"
>
	import Icon from '$parts/Icon.svelte';
	import type { IconName } from '$parts/Icon.svelte';
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
	import Select from '$parts/Select.svelte';

	const {
		id,
		status,
		labels,
		onChange,
		class: className = '',
	}: {
		id: string;
		status: Status;
		labels: Record<Status, string>;
		onChange: (id: string, status: Status) => void;
		class?: string;
	} = $props();

	let selectedValue = $derived(status);
	let pendingValue = $state<Status | null>(null);
	let confirmOpen = $state(false);
	let confirmed = false;

	let options = $derived(Object.entries(labels).map(([value, label]) => ({ value: value as Status, label: label as string })));

	function handleChange() {
		pendingValue = selectedValue;
		confirmOpen = true;
	}

	function confirmChange() {
		confirmed = true;
		if (pendingValue) onChange(id, pendingValue);
		confirmOpen = false;
	}

	// Any way the modal closes without confirming (Cancel, backdrop, Escape, X) reverts the select
	$effect(() => {
		if (confirmOpen) return;
		if (!confirmed) selectedValue = status;
		confirmed = false;
		pendingValue = null;
	});

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (confirmOpen = false), style: `secondary`, variant: `danger` },
		{ label: `Confirm`, onclick: confirmChange, variant: `success` },
	]);
</script>

<Select
	hiddenLabel={true}
	id="status-{id}"
	label="Change Status"
	bind:value={selectedValue}
	{options}
	onchange={handleChange}
	class={`${className} ${selectedValue}`}
>
	{#snippet children(option)}
		<Icon name={option.value} />
		<span class="label">{option.label}</span>
	{/snippet}
</Select>

<Modal
	bind:open={confirmOpen}
	title="Change status?"
	actions={modalActions}
>
	{#if pendingValue}
		<p>Change status to <strong>{labels[pendingValue]}</strong>?</p>
	{/if}
</Modal>

<style>
	:global(.status.select) {
		padding: 0.5em 1em;
		border: none;
		border-radius: 2em;
		background: var(--purple_bright_bg);
		color: var(--purple_bright);
		font-size: 0.8em;
	}

	:global(.status.select:is(.in_progress, .recognises)) {
		background: var(--info_bg);
		color: var(--info);
	}

	:global(.status.select:is(.done, .signing_occasionally)) {
		background: var(--success_bg);
		color: var(--success);
	}

	:global(.status.select:is(.watch, .coming_soon)) {
		background: var(--warning_bg);
		color: var(--warning);
	}
</style>
