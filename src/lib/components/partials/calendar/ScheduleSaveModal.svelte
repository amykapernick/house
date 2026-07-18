<script lang="ts">
	import Modal from '$parts/Modal.svelte';

	let {
		open = $bindable(false),
		defaultStart = ``,
		defaultEnd = ``,
		saving = false,
		error = ``,
		onConfirm,
		class: className = '',
	}: {
		open?: boolean;
		defaultStart?: string;
		defaultEnd?: string;
		saving?: boolean;
		error?: string;
		onConfirm: (payload: { scope: `default` } | { scope: `range`; start: string; end: string }) => void;
		class?: string;
	} = $props();

	let scope = $state<`default` | `range`>(`default`);
	let start = $state(``);
	let end = $state(``);

	$effect(() => {
		if (open) {
			scope = `default`;
			start = defaultStart;
			end = defaultEnd;
		}
	});

	function confirm() {
		if (scope === `default`) {
			onConfirm({ scope: `default` });
		}
		else {
			if (!start || !end) return;
			onConfirm({ scope: `range`, start, end });
		}
	}
</script>

<Modal bind:open class={className} title="Save schedule changes">
	<fieldset>
		<div class="scope_option">
			<input type="radio" id="schedule-save-default" bind:group={scope} value="default" />
			<label for="schedule-save-default">Save as default routine</label>
		</div>
		<div class="scope_option">
			<input type="radio" id="schedule-save-range" bind:group={scope} value="range" />
			<label for="schedule-save-range">Save for a date range</label>
		</div>
	</fieldset>

	{#if scope === `range`}
		<div class="date_range">
			<div class="field">
				<label for="schedule-save-start">From</label>
				<input type="date" id="schedule-save-start" bind:value={start} />
			</div>
			<div class="field">
				<label for="schedule-save-end">To</label>
				<input type="date" id="schedule-save-end" bind:value={end} />
			</div>
		</div>
	{/if}

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<button onclick={confirm} disabled={saving}>{saving ? `Saving…` : `Save`}</button>
		<button onclick={() => (open = false)} disabled={saving}>Cancel</button>
	</div>
</Modal>

<style>
	fieldset {
		display: flex;
		flex-direction: column;
		margin: 0 0 1em;
		padding: 0;
		border: none;
		gap: 0.5em;
	}

	.scope_option {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.date_range {
		display: flex;
		gap: 1em;
		margin-bottom: 1em;

		& .field {
			display: flex;
			flex-direction: column;
			gap: 0.25em;
		}
	}

	.error {
		color: var(--red);
	}

	.actions {
		display: flex;
		gap: 0.5em;
	}
</style>
