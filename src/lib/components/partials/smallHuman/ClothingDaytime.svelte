<script lang="ts">
	import type { ClothingDaytime } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson.svelte';

	const {
		daytime,
		class: className = '',
	}: {
		daytime: ClothingDaytime;
		class?: string;
	} = $props();
</script>

<DebugJson
	data={daytime}
	class={className}
/>
