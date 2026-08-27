<script lang="ts">
	import { getContext } from 'svelte';
	import { LAYOUT_WIDTH_CONTEXT_KEY, type LayoutWidthContext, type LayoutWidth } from '$utils/layoutWidth';

	let { value }: { value: LayoutWidth } = $props();

	const widthOverride = getContext<LayoutWidthContext>(LAYOUT_WIDTH_CONTEXT_KEY);

	$effect(() => {
		widthOverride.set(value);
		return () => widthOverride.set(undefined);
	});
</script>
