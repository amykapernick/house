<script lang="ts">
	import type { Resource } from '$types/resources';
	import Item from '$parts/resources/Item.svelte';

	let { category, items }: { category: string; items: Resource[] } = $props();
</script>

<section>
	<h2>{category}</h2>
	<ul>
		{#each items as resource (resource.id)}
			<Item {...resource} />
		{/each}
	</ul>
</section>

<style>
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		background: light-dark(linear-gradient(rgb(255, 255, 255) 0%, color-mix(in oklch, rgb(247, 240, 235) 55%, rgb(255, 255, 255)) 100%), linear-gradient(color-mix(in oklch, rgb(20, 23, 29) 85%, rgb(245, 240, 240)) 0%, color-mix(in oklch, rgb(20, 23, 29) 90%, rgb(245, 240, 240)) 100%));
		border: 1px solid light-dark(color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13)), color-mix(in oklch, rgb(20, 23, 29) 78%, rgb(245, 240, 240)));
		border-radius: 1em;
		box-shadow:
			rgba(13, 13, 13, 0.04) 0px 1px 2px,
			rgba(95, 65, 50, 0.07) 0px 3px 10px;
	}
</style>
