<script lang="ts">
	import Select from '$parts/Select.svelte';

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
			<span class="swatch" style:background={`var(--${option.value})`}></span>
			<span class="label">{option.label}</span>
		{/if}
	{/snippet}
</Select>

<style>
	.swatch {
		display: inline-block;
		width: 0.9em;
		height: 0.9em;
		border-radius: 50%;
		margin-right: 0.5em;
	}
</style>
