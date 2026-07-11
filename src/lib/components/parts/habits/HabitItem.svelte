<script lang="ts">
	import { format } from 'date-fns';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { Habit } from '$types/habits';

	let {
		id,
		name,
		due,
		streak,
		link,
		onComplete,
	}: Habit & { onComplete?: (id: string) => void } = $props();

	let saving = $state(false);
	let actionError = $state('');

	async function completeHabit() {
		if (saving) return;
		saving = true;
		actionError = '';

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: `mutation { completeHabit(habitId: "${id}") { success } }` }),
		}).then((r) => r.json());

		saving = false;

		if (!res?.data?.completeHabit?.success) {
			actionError = "Couldn't mark this habit complete. Try again.";
			return;
		}

		onComplete?.(id);
	}
</script>

<div class="habit">
	<button
		type="button"
		class="checkbox"
		disabled={saving}
		onclick={completeHabit}
		aria-label="Mark habit complete"
	>
		○
	</button>
	<span class="name">{name}</span>
	{#if streak > 0}
		<span class="streak">🔥 {streak}</span>
	{/if}
	{#if due}
		<span class="due">{format(due, 'dd MMM')}</span>
	{/if}
	{#if link}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is the external Todoist task page, not an internal route -->
		<a class="link" href={link} target="_blank" rel="noreferrer">Open in todoist</a>
	{/if}
	{#if actionError}<p class="error">{actionError}</p>{/if}
</div>

<style>
	.habit {
		display: grid;
		position: relative;
		grid-template-areas: 'checkbox name streak' '. due due' '. link link' 'error error error';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto auto auto;
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
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 1.2em;
		color: var(--grey);
		cursor: pointer;

		&:disabled {
			cursor: default;
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

	.streak {
		grid-area: streak;
		justify-self: end;
		font-size: 0.9em;
	}

	.due {
		display: block;
		grid-area: due;
		width: 100%;
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
