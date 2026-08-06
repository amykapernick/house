<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import styles from './index.module.css';

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

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		{ label: saving ? `Saving…` : `Save`, onclick: confirm, variant: `success`, disabled: saving },
	]);
</script>

<Modal bind:open class={className} title="Save schedule changes" actions={modalActions}>
	<fieldset class={styles.scope_fieldset}>
		<div class={styles.scope_option}>
			<input type="radio" id="schedule-save-default" bind:group={scope} value="default" />
			<label for="schedule-save-default">Save as default routine</label>
		</div>
		<div class={styles.scope_option}>
			<input type="radio" id="schedule-save-range" bind:group={scope} value="range" />
			<label for="schedule-save-range">Save for a date range</label>
		</div>
	</fieldset>

	{#if scope === `range`}
		<div class={styles.date_range}>
			<div class={styles.field}>
				<label for="schedule-save-start">From</label>
				<input type="date" id="schedule-save-start" bind:value={start} />
			</div>
			<div class={styles.field}>
				<label for="schedule-save-end">To</label>
				<input type="date" id="schedule-save-end" bind:value={end} />
			</div>
		</div>
	{/if}

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
