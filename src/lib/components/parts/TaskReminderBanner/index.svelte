<script lang="ts">
	import { resolve } from '$app/paths';
	import { dueReminderBanner, dismissReminder } from '$utils/taskReminders';
	import styles from './index.module.css';

	let { class: className = '' }: { class?: string } = $props();
</script>

{#if $dueReminderBanner.length}
	<div class="{styles.task_reminders} {className}">
		{#each $dueReminderBanner as task (task.id)}
			<div class={styles.task_reminder}>
				<a href={resolve(`/tasks`)}>{task.name}</a>
				<span class={styles.due_label}>{task.dueLabel ?? `Due now`}</span>
				<button type="button" onclick={() => dismissReminder(task.id)} aria-label="Dismiss reminder">✕</button>
			</div>
		{/each}
	</div>
{/if}
