<script lang="ts">
	import type { SleepEnvironment } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson.svelte';

	const {
		environment,
		class: className = '',
	}: {
		environment: SleepEnvironment;
		class?: string;
	} = $props();
</script>

<DebugJson
	data={environment}
	class={className}
/>
