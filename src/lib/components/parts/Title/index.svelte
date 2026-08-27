<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { TITLE_CONTEXT_KEY, type TitleContext } from '$utils/title';

	let { children }: { children: Snippet } = $props();

	const title = getContext<TitleContext>(TITLE_CONTEXT_KEY);

	$effect(() => {
		title.set(children);
		return () => title.set(undefined);
	});
</script>
