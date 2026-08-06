<script lang="ts">
	import type { Colour } from "$types/global";
	import Icon from "../Icon/index.svelte";
	import type { IconName } from "../Icon/index.svelte";
	import styles from './index.module.css';

	let {
		icon,
		label,
		class: className = ''
	}: {
		icon: IconName;
		label: string;
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<div
	class="{styles['icon-chip']} {className}"
>
	<span class={styles.icon} aria-hidden="true"><Icon name={icon} /></span>
	{label}
</div>
