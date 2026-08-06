<script lang="ts">
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import styles from './index.module.css';
	import { completeTask } from '$utils/completeTask';
	import { formatMinutes } from '$utils/formatMinutes';
	import type { Chore } from '$types/chores';

	let {
		id,
		name,
		upcoming,
		durationMinutes,
		onComplete,
		class: className = '',
	}: Chore & { onComplete?: (id: string) => void; class?: string } = $props();

	let completed = $state(false);
	let saving = $state(false);
	let actionError = $state('');
	let queued = $state(false);

	async function completeChore() {
		if (completed || saving) return;
		saving = true;
		actionError = '';
		queued = false;

		const result = await completeTask(id, `todoist`);

		saving = false;

		if (result.queued) {
			queued = true;
			return;
		}

		if (!result.success) {
			actionError = "Couldn't mark this done. Try again.";
			return;
		}

		completed = true;
		onComplete?.(id);
	}
</script>

<div class="{styles['chore-item']} {className}">
	<CheckboxButton
		class="checkbox"
		state={completed ? 'complete' : 'incomplete'}
		disabled={completed || saving}
		onclick={completeChore}
		label={completed ? `${name} done` : `Mark ${name} done`}
	/>
	<span class={styles.name}>{name}</span>
	{#if durationMinutes}<span class={styles.duration}>{formatMinutes(durationMinutes)}</span>{/if}
	{#if upcoming && !completed}<span class={styles.upcoming}>Upcoming</span>{/if}
	{#if actionError}<p class={styles.error}>{actionError}</p>{/if}
	<!-- TODO: add styling -->
	{#if queued}<p class="pending-sync">Offline - will complete when back online</p>{/if}
</div>
