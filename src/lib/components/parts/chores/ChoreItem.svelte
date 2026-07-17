<script lang="ts">
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { Chore } from '$types/chores';

	let {
		id,
		name,
		onComplete,
		class: className = '',
	}: Chore & { onComplete?: (id: string) => void; class?: string } = $props();

	let completed = $state(false);
	let saving = $state(false);
	let actionError = $state('');

	async function completeChore() {
		if (completed || saving) return;
		saving = true;
		actionError = '';

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { completeTask(taskId: "${id}", platform: todoist) { success } }`,
			}),
		}).then((r) => r.json());

		saving = false;

		if (!res?.data?.completeTask?.success) {
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
	{#if actionError}<p class="error">{actionError}</p>{/if}
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

	.error {
		margin: 0;
		color: var(--red);
		font-size: 0.8em;
	}
</style>
