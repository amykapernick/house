<script lang="ts">
	import type { Milestones, MilestoneStatus } from '$types/smallHuman';
	import Cards from '$parts/Cards/index.svelte';
	import Milestone from '$parts/smallHuman/Milestone/index.svelte';

	const {
		milestones,
		onStatusChange,
		class: className = '',
	}: {
		milestones: Milestones;
		onStatusChange?: (id: string, status: MilestoneStatus) => void;
		class?: string;
	} = $props();

	const sortedMilestones = $derived(
		[...milestones.items].sort((a, b) => {
			const aWeek = a.expected_weeks?.[0] ?? Infinity;
			const bWeek = b.expected_weeks?.[0] ?? Infinity;
			return aWeek - bWeek;
		}),
	);
</script>

<div class={className}>
	<p>{milestones.note}</p>
	<Cards>
		{#each sortedMilestones as m (m.id)}
			<Milestone
				{...m}
				type={m.category}
				{onStatusChange}
			/>
		{/each}
	</Cards>
</div>
