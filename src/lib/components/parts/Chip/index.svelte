<script lang="ts">
	import type { Colour } from '$types/global';
	import Card from '../Card/index.svelte';
	import Icon from '../Icon/index.svelte';
	import type { IconName } from '../Icon/index.svelte';
	import Tooltip from '../Tooltip/index.svelte';
	import Info from '$img/icons/c-info-fill.svg?component';
	import styles from './index.module.css';

	let {
		label,
		value,
		info,
		class: className = '',
	}: {
		label: string;
		value: string;
		info?: string;
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<Card class="{styles.chip} {className}">
	<h3>{label}</h3>
	<p>{value}</p>
	{#if info}
		<Tooltip
			label={info}
			class={styles['tooltip-trigger']}
		>
			<Info />
		</Tooltip>
	{/if}
</Card>
