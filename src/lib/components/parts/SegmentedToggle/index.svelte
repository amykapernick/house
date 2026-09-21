<script lang="ts" generics="Value extends string">
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		legend,
		name,
		options,
		value = $bindable(),
		onchange,
		onOptionClick,
		optionSuffix,
		class: className = ''
	}: {
		legend: string;
		name: string;
		options: { value: Value; label: string }[];
		value: Value;
		onchange?: () => void;
		/** Fires on every click of an option, even one that's already selected - a
		 * native radio's `change` event only fires when the value actually flips,
		 * so this is what a caller needs for a re-click on the active option to
		 * mean something (eg. toggling a sort direction). */
		onOptionClick?: (value: Value) => void;
		/** Rendered inside every option's label, after its text - eg. a direction
		 * glyph that only means something for the active option. Rendered for
		 * every option rather than just the active one so a caller can reserve
		 * the same space on all of them (`visibility: hidden` on the inactive
		 * ones) and avoid the segment widths jumping as the active one changes. */
		optionSuffix?: Snippet<[{ value: Value; active: boolean }]>;
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
				onclick={() => onOptionClick?.(option.value)}
			/>
			<label for="{name}-{option.value}" class={[value === option.value && 'active']}>
				{option.label}
				{#if optionSuffix}
					{@render optionSuffix({ value: option.value, active: value === option.value })}
				{/if}
			</label>
		{/each}
	</div>
</fieldset>
