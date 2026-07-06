<script lang="ts" generics="Status extends IconName">
	import Icon from "../Icon.svelte";
	import type { IconName } from "../Icon.svelte";
	import Modal from "../Modal.svelte";

	const {
		id,
		status,
		labels,
		onChange,
	}: {
		id: string;
		status: Status;
		labels: Record<Status, string>;
		onChange: (id: string, status: Status) => void;
	} = $props();

	let selectedValue = $state(status);
	let pendingValue = $state<Status | null>(null);
	let confirmOpen = $state(false);
	let confirmed = false;

	$effect(() => {
		selectedValue = status;
	});

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

<label class="sr-only" for="status-{id}">Change Status</label>
<select
	class="select"
	id="status-{id}"
	bind:value={selectedValue}
	onchange={handleChange}
>
	<button>
        <selectedcontent></selectedcontent>
	</button>
	{#each Object.entries(labels) as [value, label]}
		<option {value}>
			<Icon name={value as Status} />
			<span class="label">{label}</span>
		</option>
	{/each}
</select>

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
	.select {
		&, &::picker(select) {
			appearance: base-select;
		}
	}

	.confirm_actions {
		display: flex;
		gap: 0.5em;
		margin-top: 1em;
	}
</style>