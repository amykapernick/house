<script lang="ts">
	import type { Colour } from '$types/global';

	let {
		colour,
		class: className = '',
	}: {
		colour: Colour;
		class?: string;
	} = $props();
</script>

<div class={`${className}`}></div>

<style>
</style>
