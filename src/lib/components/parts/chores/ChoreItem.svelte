<script lang="ts">
	import CheckboxButton from '$parts/CheckboxButton.svelte';
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

<div class="chore-item {className}">
	<CheckboxButton
		class="checkbox"
		state={completed ? 'complete' : 'incomplete'}
		disabled={completed || saving}
		onclick={completeChore}
		label={completed ? `${name} done` : `Mark ${name} done`}
	/>
	<span class="name">{name}</span>
	{#if durationMinutes}<span class="duration">{formatMinutes(durationMinutes)}</span>{/if}
	{#if upcoming && !completed}<span class="upcoming">Upcoming</span>{/if}
	{#if actionError}<p class="error">{actionError}</p>{/if}
	<!-- TODO: add styling -->
	{#if queued}<p class="pending-sync">Offline - will complete when back online</p>{/if}
</div>

<style>
	.chore-item {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	:global(.checkbox) {
		flex-shrink: 0;
	}

	.name {
		flex: 1;
	}

	.duration {
		flex-shrink: 0;
		color: var(--grey);
		font-size: 0.75em;
	}

	.upcoming {
		flex-shrink: 0;
		color: var(--orange);
		font-size: 0.75em;
		font-weight: 700;
	}

	.error {
		margin: 0;
		color: var(--red);
		font-size: 0.8em;
	}
</style>
