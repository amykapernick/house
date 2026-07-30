<script lang="ts">
	import Pill from '$components/parts/Pill.svelte';
	import type { Season } from '$types/generated';

	let { season }: { season: Season | null } = $props();
</script>

{#if !season}
	<p>No season entity found.</p>
{:else}
	<div
		class="season"
		style={`--season_colour: ${season.colour}`}
	>
		<h3>{season.name}</h3>
		<ul class="months">
			{#each season.months as month}
				<li>
					<Pill>{month}</Pill>
				</li>
			{/each}
		</ul>
		{#if season.subtitle && season.description}
			<details class="description">
				<summary>{season.subtitle}...</summary>
				<p>{season.description}</p>
			</details>
		{:else}
			{#if season.subtitle}<p>{season.subtitle}</p>{/if}
			{#if season.description}<p>{season.description}</p>{/if}
		{/if}
	</div>
{/if}

<style>
	.season {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto 1fr;
		padding: 1em;
		border-radius: 1em;
	}

	h3 {
		margin-top: 0;
		margin-bottom: 0.5em;
	}

	.months {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 1em;

		& li {
			margin: 0;
			padding: 0;
		}
	}

	.description {
		margin-top: 1em;

		& summary {
			list-style: none;
			cursor: pointer;
		}
	}

	.description,
	p {
		grid-column: 1 / -1;
	}
</style>
