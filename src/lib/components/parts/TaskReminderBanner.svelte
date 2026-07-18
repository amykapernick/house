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
		display: flex;
		position: fixed;
		z-index: 1000;
		bottom: 4.5em;
		left: 1em;
		flex-direction: column;
		max-width: calc(100vw - 2em);
		gap: 0.5em;
	}

	.task_reminder {
		display: flex;
		align-items: center;
		padding: 0.5em 1em;
		border-radius: 0.4em;
		background: var(--purple_bright);
		box-shadow: var(--shadow_soft);
		color: var(--purple_bright_text);
		font-size: 0.85em;
		gap: 0.5em;

		& a {
			color: inherit;
			font-weight: 600;
		}

		& .due_label {
			opacity: 0.85;
		}

		& button {
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
