<script lang="ts">
	import type { ClothingSeasonal, ClothingDaytime } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson.svelte';

	const {
		clothing,
		class: className = '',
	}: {
		clothing: { clothing_seasonal: ClothingSeasonal; clothing_daytime: ClothingDaytime };
		class?: string;
	} = $props();
</script>

<DebugJson
	data={clothing}
	class={className}
/>
