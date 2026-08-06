<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import { EVERYONE } from '$utils/fetchFamilyMembers';
	import type { FamilyMember } from '$utils/fetchFamilyMembers';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		name = $bindable(``),
		recurrence = $bindable(``),
		assignedUserSlug = $bindable(EVERYONE),
		familyMembers = [],
		saving = false,
		error = ``,
		onSave,
		class: className = '',
	}: {
		open?: boolean;
		name?: string;
		recurrence?: string;
		assignedUserSlug?: string;
		familyMembers: FamilyMember[];
		saving?: boolean;
		error?: string;
		onSave: () => void;
		class?: string;
	} = $props();

	let assigneeOptions = $derived([{ value: EVERYONE, label: `Everyone` }, ...familyMembers.map((member) => ({ value: member.slug, label: member.name }))]);

	let valid = $derived(name.trim().length > 0);

	let modalActions: ModalAction[] = $derived([
		{
			label: `Cancel`,
			onclick: () => (open = false),
			style: `secondary`,
			variant: 'danger',
			disabled: saving,
		},
		{
			label: saving ? `Saving…` : `Add`,
			onclick: onSave,
			variant: `success`,
			disabled: !valid || saving,
		},
	]);
</script>

<Modal
	bind:open
	class={className}
	title="Add habit"
	actions={modalActions}
>
	<label for="habit-name">Name</label>
	<input
		type="text"
		id="habit-name"
		bind:value={name}
		placeholder="e.g. 🧘 Meditate"
	/>

	<label for="habit-recurrence">Repeats</label>
	<input
		type="text"
		id="habit-recurrence"
		bind:value={recurrence}
		placeholder="e.g. every day, every monday"
	/>

	<Select
		id="habit-assignee"
		label="Assigned to"
		bind:value={assignedUserSlug}
		options={assigneeOptions}
	/>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
