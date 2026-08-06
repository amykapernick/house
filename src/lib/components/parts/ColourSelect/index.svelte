<script lang="ts">
	import Select from '$parts/Select/index.svelte';
	import styles from './index.module.css';

	let {
		id,
		label = `Colour`,
		value = $bindable(),
		colours,
		includeNone = false,
		noneLabel = `None`,
		onchange,
		class: className = '',
	}: {
		id: string;
		label?: string;
		value: string;
		colours: string[];
		includeNone?: boolean;
		noneLabel?: string;
		onchange?: () => void;
		class?: string;
	} = $props();

	let options = $derived([
		...(includeNone ? [{ value: ``, label: noneLabel }] : []),
		...colours.map((name) => ({ value: name, label: name })),
	]);
</script>

<Select {id} {label} bind:value {options} {onchange} class={className}>
	{#snippet children(option)}
		{#if includeNone && option.value === ``}
			<span class="label">{option.label}</span>
		{:else}
			<span class={styles.swatch} style:background={`var(--${option.value})`}></span>
			<span class="label">{option.label}</span>
		{/if}
	{/snippet}
</Select>
