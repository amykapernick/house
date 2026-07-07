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
</script>

<label class="sr-only" for={id}>{label}</label>
<select class="select" {id} bind:value {onchange}>
	<button>
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
