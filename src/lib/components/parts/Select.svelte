<script lang="ts" generics="Value extends string">
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		value = $bindable(),
		options,
		onchange,
		children,
	}: {
		id: string;
		label: string;
		value: Value;
		options: { value: Value; label: string }[];
		onchange?: () => void;
		children?: Snippet<[{ value: Value; label: string }]>;
	} = $props();

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

<label class="sr-only" for={id}>{label}</label>
<select class="select" {id} bind:value {onchange} onclick={handlePickerClick}>
	<button type="button" aria-label={label}>
		<selectedcontent></selectedcontent>
	</button>
	{#each options as option (option.value)}
		<option value={option.value}>
			{#if children}
				{@render children(option)}
			{:else}
				<span class="label">{option.label}</span>
			{/if}
		</option>
	{/each}
</select>

<style>
	.select {
		&, &::picker(select) {
			appearance: base-select;
		}

		/* The browser forces the internal trigger button to display:contents under
		   appearance:base-select, so its own background never paints - but it still
		   picks up the global `button` rule's colour, which assumes an opaque button
		   background. Reset it so the text inherits the surrounding, visible colour. */
		& > button {
			all: unset;
			cursor: pointer;
		}
	}
</style>
