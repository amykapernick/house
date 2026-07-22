<script lang="ts">
	import type { Source } from '$types/smallHuman';

	const {
		sources,
		class: className = '',
	}: {
		sources: Source[];
		class?: string;
	} = $props();
</script>

<div class={className}>
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

<style>
	h3 {
		color: var(--navy);
		font-weight: 700;

		&:not(:first-of-type) {
			padding-top: 1em;
			border-top: 1px solid color-mix(in oklch, var(--background) 92%, var(--black));
		}
	}
</style>
