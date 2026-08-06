<script lang="ts">
	import styles from './index.module.css';

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

<div class="{styles['progress-bar-chart']} {className}">
	{#each items as item, index (item.label)}
		{@const max = item.max ?? 100}
		<label for="{id}-{index}">{item.label}</label>
		<progress id="{id}-{index}" value={item.value} {max}>{formatValue(item.value, max)}</progress>
	{/each}
</div>
