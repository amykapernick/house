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
</script>

<div class={className}>
	<p>{swimming.note}</p>
	<Cards>
		{#each swimming.skills as m (m.id)}
			<Milestone
				{...m}
				{onStatusChange}
			/>
		{/each}
	</Cards>
</div>
