<script lang="ts">
	import Modal from '$parts/Modal.svelte';

	let {
		open = $bindable(false),
		defaultStart = ``,
		defaultEnd = ``,
		saving = false,
		error = ``,
		onConfirm,
	}: {
		open?: boolean;
		defaultStart?: string;
		defaultEnd?: string;
		saving?: boolean;
		error?: string;
		onConfirm: (payload: { scope: `default` } | { scope: `range`; start: string; end: string }) => void;
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

<Modal bind:open title="Save schedule changes">
	<fieldset>
		<label>
			<input type="radio" bind:group={scope} value="default" />
			Save as default routine
		</label>
		<label>
			<input type="radio" bind:group={scope} value="range" />
			Save for a date range
		</label>
	</fieldset>

	{#if scope === `range`}
		<div class="date_range">
			<label>
				From
				<input type="date" bind:value={start} />
			</label>
			<label>
				To
				<input type="date" bind:value={end} />
			</label>
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
		gap: 0.5em;
		border: none;
		padding: 0;
		margin: 0 0 1em;
	}

	.date_range {
		display: flex;
		gap: 1em;
		margin-bottom: 1em;

		label {
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
