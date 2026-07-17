<script lang="ts">
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
<div class="slider {className}">
	<input {id} type="range" {min} {max} {step} bind:value {onchange} />
	{#if !hideNumber}
		<span class="number">
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
				<span class="unit">{unit}</span>
			{/if}
		</span>
	{/if}
</div>

<style>
	.slider {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 1em;
		margin: 0.1em 0 1em;

		& input[type='range'] {
			flex: 1;
			margin: 0;
		}

		& .number {
			display: flex;
			gap: 0.4em;
			align-items: baseline;
		}

		& input[type='number'] {
			width: calc(3ch + 0.2em + 3ch);
			margin: 0;
			padding: 0.1em 0.4em;
			border-width: 0;
			border-bottom-width: 1px;
			border-radius: 0;
			background: none;
			text-align: right;
			appearance: none;

		}

		& .unit {
			position: relative;
			left: -2.5ch;
			color: var(--neutral);
			font-size: 0.85em;
		}
	}
</style>
