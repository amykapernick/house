<script lang="ts">
	import type { SortDirection } from '$utils/sortable';
	import styles from './index.module.css';

	let {
		label,
		active,
		direction,
		alignRight = false,
		onclick,
	}: {
		label: string;
		active: boolean;
		direction: SortDirection;
		alignRight?: boolean;
		onclick: () => void;
	} = $props();
</script>

<th
	aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
	class={[alignRight && 'amount']}
>
	<button
		class="sort"
		type="button"
		{onclick}
	>
		{label}
		<span
			class={[styles.icon, active && styles.active]}
			aria-hidden="true"
		>
			{active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
		</span>
	</button>
</th>
