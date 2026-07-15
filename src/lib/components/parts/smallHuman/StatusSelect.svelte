<script lang="ts" generics="Status extends IconName">
	import Icon from "$parts/Icon.svelte";
	import type { IconName } from "$parts/Icon.svelte";
	import Modal from "$parts/Modal.svelte";
	import Select from "$parts/Select.svelte";

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

	let options = $derived(
		Object.entries(labels).map(([value, label]) => ({ value: value as Status, label: label as string }))
	);

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
</script>

<Select id="status-{id}" label="Change Status" bind:value={selectedValue} {options} onchange={handleChange} class={className}>
	{#snippet children(option)}
		<Icon name={option.value} />
		<span class="label">{option.label}</span>
	{/snippet}
</Select>

<Modal bind:open={confirmOpen} title="Change status?">
	{#if pendingValue}
		<p>Change status to <strong>{labels[pendingValue]}</strong>?</p>
		<div class="confirm_actions">
			<button onclick={confirmChange}>Confirm</button>
			<button onclick={() => (confirmOpen = false)}>Cancel</button>
		</div>
	{/if}
</Modal>

<style>
	.confirm_actions {
		display: flex;
		gap: 0.5em;
		margin-top: 1em;
	}
</style>
