<script lang="ts" generics="Value extends string">
	import type { Snippet } from 'svelte';

	let {
		id,
		label,
		value = $bindable(),
		options,
		onchange,
		children,
		class: className = '',
		hiddenLabel = false
	}: {
		id: string;
		label: string;
		value: Value;
		options: { value: Value; label: string }[];
		onchange?: () => void;
		children?: Snippet<[{ value: Value; label: string }]>;
		class?: string;
		hiddenLabel?: boolean
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

<label class={hiddenLabel ? 'sr-only' : ''} for={id}>{label}</label>
<select class="select {className}" {id} bind:value {onchange} onclick={handlePickerClick}>
	<button class="selected" type="button" aria-label={label}>
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
		padding: 0;
		border: 1px solid var(--input_border);
		background: var(--input_bg);
		cursor: pointer;

		&, &::picker(select) {
			display: grid;
			grid-template-areas: 'selected picker';
			grid-template-columns: 1fr auto;
			align-items: center;
			margin-top: 0.2em;
			border: 1px solid var(--input_border);
			border-radius: 0.5em;
			background: var(--white_true);
			box-shadow: var(--shadow_popover);
			appearance: base-select;
			gap: 0;
		}

		/* TODO: Clean up these styles */
		&:not(:open) {
			&::picker(select) {
				display: none;
			}
		}

		&::picker-icon {
			grid-area: picker;
			padding: 0.2em 0.5em;
		}

		& > option {
			grid-column: 1 / -1;
			padding: 0.5em 1em;
			line-height: 1;
			cursor: pointer;
			
			&:hover {
				background: color-mix(var(--navy) 10%, light-dark(var(--white), var(--black)));
			}

			&:focus {
				outline-offset: -2px;
			}

			&:checked {
				background: color-mix(var(--purple_bright) 30%, light-dark(var(--white), var(--black)));
			}

			&::checkmark {
				display: none;
			}
		}
	}

	.selected {
		display: block;
		grid-area: selected;
		height: 100%;
		padding: 0.5em 1em;
		border: none;
		background: none;
		color: var(--black);
		font-size: 1em;
		cursor: pointer;
	}
</style>
