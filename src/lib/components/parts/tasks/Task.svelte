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
			color: $grey;
		}

		&.partial {
			color: $orange;
		}

		&.complete {
			color: $green;
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
			background: $grey;
			color: $white;
		}

		&[data-status='in-progress'],
		&[data-status='ongoing'] {
			background: $blue;
		}

		&[data-status='paused'] {
			background: $orange;
		}

		&[data-status='done'] {
			background: $green;
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
