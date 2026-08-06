<script lang="ts">
	import type { Resource } from '$types/resources';
	import Item from '$parts/resources/Item/index.svelte';
	import styles from './index.module.css';

	let { category, items }: { category: string; items: Resource[] } = $props();
</script>

<section>
	<h2>{category}</h2>
	<ul class={styles.root}>
		{#each items as resource (resource.id)}
			<Item {...resource} />
		{/each}
	</ul>
</section>
