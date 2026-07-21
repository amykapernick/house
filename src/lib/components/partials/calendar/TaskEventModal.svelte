<script lang="ts">
	import { format } from 'date-fns';
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';

	let {
		open = $bindable(false),
		title,
		due,
		status,
		platform,
		link,
		saving = false,
		error = ``,
		onComplete,
		class: className = '',
	}: {
		open?: boolean;
		title: string;
		due?: Date;
		status?: string;
		platform: `notion` | `todoist`;
		link: string;
		saving?: boolean;
		error?: string;
		onComplete: () => void;
		class?: string;
	} = $props();

	let dueLabel = $derived(due ? format(due, `EEEE, d MMM · h:mma`) : ``);
	let alreadyDone = $derived(status === `Done`);

	let completeLabel = $derived(alreadyDone ? `Already complete` : saving ? `Completing…` : `Mark complete`);

	let modalActions: ModalAction[] = $derived([
		{ label: `Close`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		{ label: completeLabel, onclick: onComplete, variant: `success`, disabled: saving || alreadyDone },
	]);
</script>

<Modal bind:open class={className} title={title} actions={modalActions}>
	{#if dueLabel}<p class="due_label">{dueLabel}</p>{/if}

	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
	<a class="external" href={link} target="_blank" rel="noreferrer">Open in {platform}</a>

	{#if error}<p class="error">{error}</p>{/if}
</Modal>

<style>
	@import '@mixins';

	.due_label {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.9em;
	}

	.error {
		color: var(--red);
	}

	.external {
		display: inline-block;
		margin-bottom: 1em;
		color: var(--purple_bright);
	}
</style>
