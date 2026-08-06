<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isAuthenticated } from '$lib/auth';
	import fetchChoresData from '$utils/choresData';
	import { setCache } from '$utils/fetchClientData';
	import ChoreList from '$parts/chores/ChoreList/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import type { Chore } from '$types/chores';
	import { getPageTitle } from '$utils/pageTitle';

	let chores = $state<Chore[]>([]);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleChores(data: Chore[]) {
				chores = data;
				loading = false;
			}
			fetchChoresData({ onStale: handleChores }).then(handleChores);
		}
	});

	// A completed chore won't reappear from Todoist until its next recurrence,
	// so drop it from the current view (and the shared cache) too.
	function handleChoreComplete(id: string) {
		chores = chores.filter((chore) => chore.id !== id);
		setCache(`chores-${format(new Date(), DATE_FORMATS.iso)}`, { chores });
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Chores`)}</title>
	<meta name="description" content="Track recurring household chores" />
</svelte:head>

<h1>Chores</h1>
{#if loading}
	<Skeleton rows={3} />
{:else}
	<ChoreList {chores} onComplete={handleChoreComplete} />
{/if}
