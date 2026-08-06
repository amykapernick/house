<script lang="ts">
	import { format } from 'date-fns';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import styles from './index.module.css';

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
	{#if dueLabel}<p class={styles.due_label}>{dueLabel}</p>{/if}

	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
	<a class={styles.external} href={link} target="_blank" rel="noreferrer">Open in {platform}</a>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
