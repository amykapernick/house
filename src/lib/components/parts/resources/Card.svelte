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
		margin: 0;
		padding: 0;
		border: 1px solid light-dark(color-mix(in oklch, var(--background) 78%, var(--black)), color-mix(in oklch, var(--dark_background) 78%, var(--white)));
		border-radius: 1em;
		background: light-dark(linear-gradient(var(--white_true) 0%, color-mix(in oklch, var(--background) 55%, var(--white_true)) 100%), linear-gradient(color-mix(in oklch, var(--dark_background) 85%, var(--white)) 0%, color-mix(in oklch, var(--dark_background) 90%, var(--white)) 100%));
		box-shadow: var(--shadow_card);
		list-style: none;
	}
</style>
