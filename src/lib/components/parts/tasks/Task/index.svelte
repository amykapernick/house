<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import Assigned from '../Assigned/index.svelte';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import type { CheckState } from '$parts/CheckboxButton/index.svelte';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import { completeTask as completeTaskRequest } from '$utils/completeTask';
	import type { Task, TaskStatus } from '$types/tasks';
	import Notion from '$img/icons/notion.svg?component';
	import Todoist from '$img/icons/todoist.svg?component';
	import GitHub from '$img/icons/github-fill.svg?component';
	import styles from './index.module.css';

	let { id, name, status, due, assigned, platform, link, onUpdate, class: className = '' }: Task & { onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();

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

	let completed = $derived(StatusComplete[status]);
	let saving = $state(false);
	let actionError = $state('');
	let queued = $state(false);

	async function runMutation(query: string) {
		const token = await getToken();
		return fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query }),
		}).then((r) => r.json());
	}

	async function completeTask() {
		if (completed === 'complete' || saving || platform === 'github') return;
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

	async function changeStatus(event: Event) {
		const previousStatus = status;
		const newStatus = (event.target as HTMLSelectElement).value as TaskStatus;
		if (newStatus === previousStatus) return;

		status = newStatus;
		saving = true;
		actionError = '';

		const res = await runMutation(`mutation { updateTaskStatus(taskId: "${id}", status: "${newStatus}") { success } }`);

		saving = false;

		if (!res?.data?.updateTaskStatus?.success) {
			actionError = "Couldn't update this task's status. Try again.";
			status = previousStatus;
			return;
		}

		onUpdate?.(id, newStatus);
	}
</script>

<div class="{styles.task} {className}">
	<CheckboxButton
		class="checkbox"
		state={completed}
		disabled={completed === 'complete' || saving || platform === 'github'}
		onclick={completeTask}
		label={completed === 'complete' ? 'Task complete' : 'Mark task complete'}
	/>
	<span class={styles.name}>{name}</span>
	{#if platform === 'notion'}
		<select
			class={styles.status}
			data-status={status.replaceAll(' ', '-').toLowerCase()}
			value={status}
			disabled={saving}
			onchange={changeStatus}
			aria-label="Change task status"
		>
			{#each statusOptions as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
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
			class="assigned"
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
			<!-- TODO: select correct icon per platform -->
			<Notion />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
	{#if actionError}<p class={styles.error}>{actionError}</p>{/if}
	<!-- TODO: add styling -->
	{#if queued}<p class="pending-sync">Offline - will complete when back online</p>{/if}
</div>
