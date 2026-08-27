<script
	lang="ts"
	generics="Value extends string"
>
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		id,
		label,
		value = $bindable(),
		options,
		onchange,
		children,
		class: className = '',
		hiddenLabel = false,
	}: {
		id: string;
		label: string;
		value: Value;
		options: { value: Value; label: string }[];
		onchange?: () => void;
		children?: Snippet<[{ value: Value; label: string }]>;
		class?: string;
		hiddenLabel?: boolean;
	} = $props();

	let selectedOption = $derived(options.find((option) => option.value === value));

	// In some Chromium versions, clicking an option in an appearance:base-select
	// picker inside a focus-trapped <dialog> (showModal()) doesn't fire `change`,
	// so bind:value never updates. Forward the click manually as a safety net.
	function handlePickerClick(event: MouseEvent) {
		const option = (event.target as HTMLElement).closest(`option`);
		if (!option) return;
		const newValue = option.value as Value;
		if (newValue === value) return;
		value = newValue;
		onchange?.();
	}
</script>

<label
	class={hiddenLabel ? 'sr-only' : ''}
	for={id}>{label}</label
>
<select
	class="{styles.select} {className}"
	{id}
	bind:value
	{onchange}
	onclick={handlePickerClick}
>
	<button
		class={styles.selected}
		type="button"
		aria-label={label}
	>
		<selectedcontent class={styles.selectedcontent}>
			{#if selectedOption}
				{#if children}
					{@render children(selectedOption)}
				{:else}
					{selectedOption.label}
				{/if}
			{/if}
		</selectedcontent>
	</button>
	{#each options as option (option.value)}
		<option
			value={option.value}
			class={styles.option}
		>
			{#if children}
				{@render children(option)}
			{:else}
				{option.label}
			{/if}
		</option>
	{/each}
</select>
