<script lang="ts">
	import type { Component } from 'svelte';
	import styles from './index.module.css';

	let {
		options,
		value,
		toggleFunction,
		name,
		class: className = '',
	}: {
		options: { label: string; Icon?: Component<Record<string, any>> }[];
		value: number;
		toggleFunction: (index: number) => void;
		name: string;
		class?: string;
	} = $props();

	const switchId = $props.id();

	const labelled = $derived(options.some(({ Icon }) => !Icon));
</script>

<div
	class="{styles.container} {className} {labelled ? styles.labelled : ''}"
	role="radiogroup"
	aria-label={name}
>
	{#each options as { label, Icon }, index (label)}
		<input
			type="radio"
			id={`${switchId}_${label.replace(' ', '')}`}
			name={switchId}
			value={index}
			checked={value === index}
			onchange={() => toggleFunction(index)}
			class={styles.radio}
		/>
		<label
			class={styles.label}
			for={`${switchId}_${label.replace(' ', '')}`}
		>
			<span class={styles.text}>{label}</span>
			{#if Icon}
				<Icon class="icon" />
			{/if}
		</label>
	{/each}
	<span class={styles.switch}></span>
</div>
