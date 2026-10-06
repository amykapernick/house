<script lang="ts">
	import type { Swimming, MilestoneStatus } from '$types/smallHuman';
	import Cards from '$parts/Cards/index.svelte';
	import Milestone from '$parts/smallHuman/Milestone/index.svelte';

	const {
		swimming,
		onStatusChange,
		class: className = '',
	}: {
		swimming: Swimming;
		onStatusChange?: (id: string, status: MilestoneStatus) => void;
		class?: string;
	} = $props();

	const sortedSkills = $derived(
		[...swimming.skills].sort((a, b) => {
			if (a.status === 'done' && b.status !== 'done') return 1;
			if (a.status !== 'done' && b.status === 'done') return -1;
			return 0;
		}),
	);
</script>

<div class={className}>
	<p>{swimming.note}</p>
	<Cards>
		{#each sortedSkills as m (m.id)}
			<Milestone
				{...m}
				{onStatusChange}
			/>
		{/each}
	</Cards>
</div>
