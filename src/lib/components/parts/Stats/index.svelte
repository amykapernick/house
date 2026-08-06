<script lang="ts">
	import type { Colour } from '$types/global';
	import type { Component } from 'svelte';
	import Tooltip from '../Tooltip/index.svelte';
	import Info from '$img/icons/c-info-fill.svg?component';
	import styles from './index.module.css';

	const {
		items,
		colour,
		class: className = '',
	}: {
		items: {
			name: string;
			value: string;
			colour?: Colour;
			Icon?: Component;
			note?: string;
		}[];
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<dl
	class="{styles.root} {className}"
	style="

--colour: var(--{colour || 'blue'})"
>
	{#each items as { name, value, colour, Icon, note } (name)}
		<div
			class={styles.item}
			style="

--colour: var(--{colour})"
		>
			<dt>{name}</dt>
			<dd>{value}</dd>
			{#if Icon}<span class={styles.icon}><Icon /></span>{/if}
			{#if note}
				<Tooltip label={note}>
					<Info />
				</Tooltip>
			{/if}
		</div>
	{/each}
</dl>
