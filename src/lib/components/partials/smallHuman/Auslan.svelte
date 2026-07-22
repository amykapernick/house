<script lang="ts">
	import type { Auslan, SignStatus } from '$types/smallHuman';
	import Cards from '$parts/Cards.svelte';
	import AuslanSign from '$parts/smallHuman/Auslan.svelte';

	const {
		auslan,
		onStatusChange,
		class: className = '',
	}: {
		auslan: Auslan;
		onStatusChange?: (id: string, status: SignStatus) => void;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<p>{auslan.note}</p>
	<Cards>
		{#each auslan.signs as s (s.id)}
			<AuslanSign
				{...s}
				{onStatusChange}
			/>
		{/each}
	</Cards>
</div>
