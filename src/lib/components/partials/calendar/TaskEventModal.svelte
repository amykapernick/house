<script lang="ts">
	import { format } from 'date-fns';
	import Modal from '$parts/Modal.svelte';

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
</script>

<Modal bind:open class={className} title={title}>
	{#if dueLabel}<p class="due_label">{dueLabel}</p>{/if}

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<button onclick={onComplete} disabled={saving || alreadyDone}>
			{#if alreadyDone}
				Already complete
			{:else}
				{saving ? `Completing…` : `Mark complete`}
			{/if}
		</button>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
		<a class="external" href={link} target="_blank" rel="noreferrer">Open in {platform}</a>
		<button onclick={() => (open = false)} disabled={saving}>Close</button>
	</div>
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

	.actions {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.external {
		color: var(--purple_bright);
	}
</style>
