<script lang="ts">
	import Pill from '$components/parts/Pill/index.svelte';
	import type { Season } from '$types/generated';
	import styles from './index.module.css';

	let { season }: { season: Season | null } = $props();
</script>

{#if !season}
	<p>No season entity found.</p>
{:else}
	<div
		class={styles.season}
		style={`--season_colour: ${season.colour}`}
	>
		<h3>{season.name}</h3>
		<ul class={styles.months}>
			{#each season.months as month (month)}
				<li>
					<Pill>{month}</Pill>
				</li>
			{/each}
		</ul>
		{#if season.subtitle && season.description}
			<details class={styles.description}>
				<summary>{season.subtitle}...</summary>
				<p>{season.description}</p>
			</details>
		{:else}
			{#if season.subtitle}<p>{season.subtitle}</p>{/if}
			{#if season.description}<p>{season.description}</p>{/if}
		{/if}
	</div>
{/if}
