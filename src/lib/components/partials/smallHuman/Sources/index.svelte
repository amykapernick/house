<script lang="ts">
	import type { Source } from '$types/smallHuman';
	import styles from './index.module.css';

	const {
		sources,
		class: className = '',
	}: {
		sources: Source[];
		class?: string;
	} = $props();
</script>

<div class="{styles.root} {className}">
	{#each sources as s (s.id)}
		<h3>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- s.url is an external reference source, not an internal route -->
			<a
				href={s.url}
				target="_blank"
			>
				{s.name}</a
			><!-- eslint-enable svelte/no-navigation-without-resolve -->
		</h3>
		<p>{s.detail}</p>
		{#if s.note}<p>{s.note}</p>{/if}
	{/each}
</div>
