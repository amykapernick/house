<script lang="ts">
	import { format } from 'date-fns';
	import Assigned from './Assigned.svelte';
	import type { Task, TaskStatus } from '$types/tasks';

	let { name, status, due, assigned }: Task = $props();

	const StatusComplete: Record<TaskStatus, string> = {
		'Not Started': 'incomplete',
		'In Progress': 'partial',
		Ongoing: 'partial',
		Paused: 'partial',
		Done: 'complete',
	};

	let completed = $derived(StatusComplete[status]);
</script>

<div class="task">
	<span class="checkbox {completed}">
		{#if completed === 'complete'}✓{:else if completed === 'partial'}◐{:else}○{/if}
	</span>
	<span class="name">{name}</span>
	<span class="status" data-status={status.replaceAll(' ', '-').toLowerCase()}>{status}</span>
	{#if due}
		<span class="due">{format(due, 'dd MMM')}</span>
	{/if}
	{#if assigned}
		<Assigned className="assigned" assignees={assigned} />
	{/if}
</div>

<style>
	.task {
		display: grid;
		position: relative;
		grid-template-areas: 'checkbox status status' 'checkbox name name' '. due assigned';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto 1fr;
		align-items: start;
		padding: 0.3em 0.5em;
		border-radius: 0.2em;
		background: var(--feature_colour);
		color: var(--neutral);
		gap: 0.2em 1ch;
	}

	.checkbox {
		grid-area: checkbox;
		align-self: center;
		font-size: 1.2em;

		&.incomplete {
			color: var(--grey);
		}

		&.partial {
			color: var(--orange);
		}

		&.complete {
			color: var(--green);
		}
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
		border-radius: 0.1em;
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
</style>
