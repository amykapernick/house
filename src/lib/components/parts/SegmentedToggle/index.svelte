<script lang="ts" generics="Value extends string">
	import styles from './index.module.css';

	let {
		legend,
		name,
		options,
		value = $bindable(),
		onchange,
		class: className = ''
	}: {
		legend: string;
		name: string;
		options: { value: Value; label: string }[];
		value: Value;
		onchange?: () => void;
		class?: string;
	} = $props();
</script>

<fieldset class="{className}">
	<legend class="sr-only">{legend}</legend>
	<div class={styles.segments}>
		{#each options as option (option.value)}
			<input
				type="radio"
				id="{name}-{option.value}"
				{name}
				value={option.value}
				bind:group={value}
				{onchange}
			/>
			<label for="{name}-{option.value}" class={[value === option.value && 'active']}>
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>
