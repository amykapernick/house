<script lang="ts">
	import styles from './index.module.css';

	let {
		id,
		label,
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		onchange,
		class: className = '',
		hiddenLabel = false,
		hideNumber = false,
		unit
	}: {
		id: string;
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		onchange?: () => void;
		class?: string;
		hiddenLabel?: boolean;
		hideNumber?: boolean;
		unit?: string;
	} = $props();
</script>

<label class={hiddenLabel ? 'sr-only' : ''} for={id}>{label}</label>
<div class="{styles.slider} {className}">
	<input {id} type="range" {min} {max} {step} bind:value {onchange} />
	{#if !hideNumber}
		<span class={styles.number}>
			<input
				type="number"
				{min}
				{max}
				{step}
				bind:value
				{onchange}
				aria-label="{label} value{unit ? ` in ${unit}` : ''}"
			/>
			{#if unit}
				<span class={styles.unit}>{unit}</span>
			{/if}
		</span>
	{/if}
</div>
