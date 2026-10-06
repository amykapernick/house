<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import Assigned from '../Assigned/index.svelte';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import type { CheckState } from '$parts/CheckboxButton/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import { completeTask as completeTaskRequest } from '$utils/completeTask';
	import { updateTaskStatus } from '$utils/updateTaskStatus';
	import type { Task, TaskStatus } from '$types/tasks';
	import type { Component } from 'svelte';
	import Notion from '$img/icons/notion.svg?component';
	import Todoist from '$img/icons/todoist.svg?component';
	import GitHub from '$img/icons/github-fill.svg?component';
	import styles from './index.module.css';

	let {
		id,
		name,
		status,
		due,
		assigned,
		project,
		platform,
		link,
		onUpdate,
		dueBadge,
		class: className = '',
	}: Task & { onUpdate?: (id: string, status: TaskStatus) => void; dueBadge?: string; class?: string } = $props();

	const StatusComplete: Record<TaskStatus, CheckState> = {
		'Not Started': 'incomplete',
		'In Progress': 'partial',
		'Ongoing': 'partial',
		'Paused': 'partial',
		'Done': 'complete',
	};

	// Notion tasks can carry any of these; Todoist only ever reports Done/Not Started,
	// so the status dropdown is Notion-only and completeTask already covers Todoist.
	const statusOptions: TaskStatus[] = ['Not Started', 'In Progress', 'Ongoing', 'Paused', 'Done'];
	const statusSelectOptions = statusOptions.map((option) => ({ value: option, label: option }));

	const PLATFORM_ICONS: Record<string, Component> = {
		notion: Notion,
		todoist: Todoist,
		github: GitHub,
	};

	let completed = $derived(StatusComplete[status]);
	let category = $derived(project?.[0]?.name);
	let PlatformIcon = $derived(PLATFORM_ICONS[platform] ?? Notion);
	let saving = $state(false);
	let actionError = $state('');
	let queued = $state(false);

	// Select's bind:value already applies the change before onchange fires, so this
	// tracks the pre-change status separately rather than reading it off the event.
	// Writable $derived re-syncs to `status` whenever it changes externally (e.g. a
	// Kanban drag), while still being freely reassignable for the rollback below.
	let selectedStatus = $derived(status);

	async function completeTask() {
		if (completed === 'complete' || saving) return;
		saving = true;
		actionError = '';
		queued = false;

		const result = await completeTaskRequest(id, platform);

		saving = false;

		if (result.queued) {
			queued = true;
			return;
		}

		if (!result.success) {
			actionError = "Couldn't mark this task complete. Try again.";
			return;
		}

		onUpdate?.(id, 'Done');
	}

	async function changeStatus() {
		const previousStatus = status;
		const newStatus = selectedStatus;
		if (newStatus === previousStatus) return;

		status = newStatus;
		saving = true;
		actionError = '';

		const result = await updateTaskStatus(id, newStatus);

		saving = false;

		if (!result.success) {
			actionError = "Couldn't update this task's status. Try again.";
			status = previousStatus;
			selectedStatus = previousStatus;
			return;
		}

		onUpdate?.(id, newStatus);
	}
</script>

<div class="{styles.task} {className}">
	<CheckboxButton
		class={styles.checkbox}
		variant="boxed"
		state={completed}
		disabled={completed === 'complete' || saving}
		onclick={completeTask}
		label={completed === 'complete' ? 'Task complete' : 'Mark task complete'}
	/>
	<span class={styles.name}>{name}</span>
	<div class={styles.meta}>
		{#if category}<span class={styles.category}>{category}</span>{/if}
		{#if dueBadge}
			<span class={styles.due_badge} data-due={dueBadge.replaceAll(' ', '-').toLowerCase()}>{dueBadge}</span>
		{/if}
		{#if platform === 'notion'}
			<Select
				id="status-{id}"
				label="Change task status"
				hiddenLabel={true}
				class={styles.statusSelect}
				data-status={status.replaceAll(' ', '-').toLowerCase()}
				bind:value={selectedStatus}
				options={statusSelectOptions}
				onchange={changeStatus}
				disabled={saving}
			/>
		{:else}
			<span
				class={styles.status}
				data-status={status.replaceAll(' ', '-').toLowerCase()}>{status}</span
			>
		{/if}
		{#if due}
			<span class={styles.due}>{format(due, DATE_FORMATS.short)}</span>
		{/if}
		{#if assigned}
			<Assigned
				class={styles.assigned}
				assignees={assigned}
			/>
		{/if}
		{#if link}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
			<a
				class={styles.link}
				href={link}
				target="_blank"
				rel="noreferrer"
			>
				<span class="sr-only">Open in {platform}</span>
				<PlatformIcon />
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>
	{#if actionError}<p class={styles.error}>{actionError}</p>{/if}
	<!-- TODO: add styling -->
	{#if queued}<p class="pending-sync">Offline - will complete when back online</p>{/if}
</div>
