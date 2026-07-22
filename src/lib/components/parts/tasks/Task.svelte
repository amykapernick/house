<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import Assigned from './Assigned.svelte';
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import type { CheckState } from '$parts/CheckboxButton.svelte';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { Task, TaskStatus } from '$types/tasks';

	let {
		id,
		name,
		status,
		due,
		assigned,
		platform,
		link,
		onUpdate,
		class: className = '',
	}: Task & { onUpdate?: (id: string, status: TaskStatus) => void; class?: string } = $props();

	const StatusComplete: Record<TaskStatus, CheckState> = {
		'Not Started': 'incomplete',
		'In Progress': 'partial',
		Ongoing: 'partial',
		Paused: 'partial',
		Done: 'complete',
	};

	// Notion tasks can carry any of these; Todoist only ever reports Done/Not Started,
	// so the status dropdown is Notion-only and completeTask already covers Todoist.
	const statusOptions: TaskStatus[] = ['Not Started', 'In Progress', 'Ongoing', 'Paused', 'Done'];

	let completed = $derived(StatusComplete[status]);
	let saving = $state(false);
	let actionError = $state('');

	async function runMutation(query: string) {
		const token = await getToken();
		return fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query }),
		}).then((r) => r.json());
	}

	async function completeTask() {
		if (completed === 'complete' || saving || platform === 'github') return;
		saving = true;
		actionError = '';

		const res = await runMutation(
			`mutation { completeTask(taskId: "${id}", platform: ${platform}) { success } }`
		);

		saving = false;

		if (!res?.data?.completeTask?.success) {
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

		const res = await runMutation(
			`mutation { updateTaskStatus(taskId: "${id}", status: "${newStatus}") { success } }`
		);

		saving = false;

		if (!res?.data?.updateTaskStatus?.success) {
			actionError = "Couldn't update this task's status. Try again.";
			status = previousStatus;
			return;
		}

		onUpdate?.(id, newStatus);
	}
</script>

<div class="task {className}">
	<CheckboxButton
		class="checkbox"
		state={completed}
		disabled={completed === 'complete' || saving || platform === 'github'}
		onclick={completeTask}
		label={completed === 'complete' ? 'Task complete' : 'Mark task complete'}
	/>
	<span class="name">{name}</span>
	{#if platform === 'notion'}
		<select
			class="status"
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
		<span class="status" data-status={status.replaceAll(' ', '-').toLowerCase()}>{status}</span>
	{/if}
	{#if due}
		<span class="due">{format(due, DATE_FORMATS.short)}</span>
	{/if}
	{#if assigned}
		<Assigned class="assigned" assignees={assigned} />
	{/if}
	{#if link}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
		<a class="link" href={link} target="_blank" rel="noreferrer">Open in {platform}</a>
	{/if}
	{#if actionError}<p class="error">{actionError}</p>{/if}
</div>

<style>
	.task {
		display: grid;
		position: relative;
		grid-template-areas: 'checkbox status status' 'checkbox name name' '. due assigned' '. link link' 'error error error';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto auto auto 1fr;
		align-items: start;
		padding: 0.3em 0.5em;
		border-radius: 0.2em;
		background: var(--feature_colour);
		color: var(--neutral);
		gap: 0.2em 1ch;
	}

	:global(.checkbox) {
		grid-area: checkbox;
		align-self: center;
	}

	.name {
		grid-area: name;
		margin: 0;
		font-size: 1.2em;
		font-weight: 600;
		word-wrap: break-word;
		word-break: break-word;
		white-space: wrap;
	}

	.status {
		display: block;
		grid-area: status;
		padding: 0.1em 0.2em;
		border: none;
		border-radius: 0.1em;
		font: inherit;
		font-size: 0.6em;
		line-height: 1;
		justify-self: end;

		&[data-status='not-started'] {
			background: var(--grey);
			color: var(--grey_text);
		}

		&[data-status='in-progress'],
		&[data-status='ongoing'] {
			background: var(--blue);
			color: var(--blue_text);
		}

		&[data-status='paused'] {
			background: var(--orange);
			color: var(--orange_text);
		}

		&[data-status='done'] {
			background: var(--green);
			color: var(--green_text);
		}
	}

	.due {
		display: block;
		grid-area: due;
		width: 100%;
	}

	:global(.assigned) {
		grid-area: assigned;
	}

	.link {
		grid-area: link;
		justify-self: start;
		color: var(--purple_bright);
		font-size: 0.9em;
	}

	.error {
		grid-area: error;
		margin: 0;
		color: var(--red);
		font-size: 0.8em;
	}
</style>
