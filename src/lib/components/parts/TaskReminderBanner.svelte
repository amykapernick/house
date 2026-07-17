<script lang="ts">
	import { resolve } from '$app/paths';
	import { dueReminderBanner, dismissReminder } from '$utils/taskReminders';

	let { class: className = '' }: { class?: string } = $props();
</script>

{#if $dueReminderBanner.length}
	<div class="task_reminders {className}">
		{#each $dueReminderBanner as task (task.id)}
			<div class="task_reminder">
				<a href={resolve(`/tasks`)}>{task.name}</a>
				<span class="due_label">{task.dueLabel ?? `Due now`}</span>
				<button type="button" onclick={() => dismissReminder(task.id)} aria-label="Dismiss reminder">✕</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.task_reminders {
		position: fixed;
		left: 1em;
		bottom: 4.5em;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		max-width: calc(100vw - 2em);
		z-index: 1000;
	}

	.task_reminder {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 1em;
		background: var(--purple_bright);
		color: var(--purple_bright_text);
		font-size: 0.85em;
		border-radius: 0.4em;
		box-shadow: 0 0.1em 0.5em rgba(0, 0, 0, 0.25);

		a {
			color: inherit;
			font-weight: 600;
		}

		.due_label {
			opacity: 0.85;
		}

		button {
			margin-left: auto;
			padding: 0;
			border: none;
			background: var(--transparent);
			color: inherit;
			font-size: 1em;
			line-height: 1;
			cursor: pointer;
		}
	}
</style>
