<script lang="ts">
	import type { ClothingSeasonal } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson.svelte';

	const {
		seasonal,
		class: className = '',
	}: {
		seasonal: ClothingSeasonal;
		class?: string;
	} = $props();
</script>

<DebugJson
	data={seasonal}
	class={className}
/>
