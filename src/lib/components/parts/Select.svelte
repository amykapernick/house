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
		cursor: pointer;
		padding: 0;
		background: color-mix(in oklch, rgb(255, 255, 255) 65%, rgb(247, 240, 235));
		border: 1px solid color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13));

		&, &::picker(select) {
			appearance: base-select;
			display: grid;
			grid-template-areas: 'selected picker';
			grid-template-columns: 1fr auto;
			gap: 0;
			align-items: center;
			margin-top: 0.2em;
			border-radius: 0.5em;
			border: 1px solid color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13));
			box-shadow: rgba(13, 13, 13, 0.04) 0px 1px 2px, rgba(95, 65, 50, 0.09) 0px 8px 20px;
			background: rgb(255, 255, 255);
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
			cursor: pointer;
			padding: 0.4em 0.8em;
			line-height: 1;
			
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
		grid-area: selected;
		display: block;
		cursor: pointer;
		padding: 0.5em 1em;
		height: 100%;
		background: none;
		border: none;
		font-size: inherit;
		color: rgb(13, 13, 13);
	}
</style>
