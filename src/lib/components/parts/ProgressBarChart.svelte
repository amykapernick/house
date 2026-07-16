<script lang="ts">
	let {
		id,
		items,
		formatValue = (value, max) => `${Math.round((value / max) * 100)}%`,
		class: className = ''
	}: {
		id: string;
		items: { label: string; value: number; max?: number }[];
		formatValue?: (value: number, max: number) => string;
		class?: string;
	} = $props();
</script>

<div class="progress-bar-chart {className}">
	{#each items as item, index (item.label)}
		{@const max = item.max ?? 100}
		<label for="{id}-{index}">{item.label}</label>
		<progress id="{id}-{index}" value={item.value} {max}>{formatValue(item.value, max)}</progress>
	{/each}
</div>

<style>
	.progress-bar-chart {
		display: flex;
		flex-direction: column;
	}

	progress {
		display: block;
		width: 100%;
		height: 0.8em;
		margin: 0.2em 0 1em;
		accent-color: var(--purple_bright);
	}
</style>
