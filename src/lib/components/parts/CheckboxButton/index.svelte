<script lang="ts">
	import type { Component } from 'svelte';
	import Check from '$img/icons/check (2).svg?component';
	import PartialCheck from '$img/icons/progress-2.svg?component';
	import Incomplete from '$img/icons/circle-outline.svg?component';
	import styles from './index.module.css';
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
	class={['checkbox', styles[variant], styles[state], className].filter(Boolean).join(' ')}
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
