<script lang="ts">
	import type { Component } from 'svelte';
	import Check from '$img/icons/check (2).svg?component';
	import PartialCheck from '$img/icons/progress-2.svg?component';
	import Incomplete from '$img/icons/circle-outline.svg?component';
	export type CheckState = 'incomplete' | 'partial' | 'complete';

	let {
		state = 'incomplete',
		variant = 'flat',
		loading = false,
		disabled = false,
		label,
		class: className = '',
		onclick,
	}: {
		state?: CheckState;
		variant?: 'flat' | 'boxed';
		loading?: boolean;
		disabled?: boolean;
		label: string;
		class?: string;
		onclick?: () => void;
	} = $props();

	const ICON: Record<CheckState, Component> = { incomplete: Incomplete, partial: PartialCheck, complete: Check };
	const IconComponent = $derived(ICON[state]);
</script>

<button
	type="button"
	class="checkbox {variant} {state} {className}"
	disabled={disabled || loading}
	{onclick}
	aria-label={label}
>
	{#if loading}
		…
	{:else if variant === 'boxed'}
		{#if state === 'complete'}<Check />{/if}
	{:else}
		<IconComponent />
	{/if}
</button>

<style>
	.checkbox {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		cursor: pointer;
	}

	.flat {
		font-size: 1.2em;

		&:disabled {
			cursor: default;
		}

		&.incomplete {
			color: var(--grey);
		}

		&.partial {
			color: var(--orange);
		}

		&.complete {
			color: var(--green);

			& :global(svg) {
				padding: 0.15em;
				border: 1px solid currentColor;
				border-radius: 50%;
			}
		}
	}

	.boxed {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		transition: all 0.15s;
		border: 2px solid var(--grey_light);
		border-radius: 0.3em;
		background: var(--transparent);
		color: var(--grey);
		font-size: 0.85em;

		&:hover:not(:disabled) {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}

		&.complete {
			border-color: var(--green);
			background: var(--green);
			color: var(--green_text);
		}

		&:disabled {
			opacity: 0.5;
			cursor: wait;
		}
	}
</style>
