<script lang="ts">
	import type { SortDirection } from '$utils/sortable';

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
	class:amount={alignRight}
>
	<button
		class="sort"
		type="button"
		{onclick}
	>
		{label}
		<span
			class="icon"
			class:active
			aria-hidden="true"
		>
			{active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
		</span>
	</button>
</th>

<style>
	.icon {
		opacity: 0.5;
		font-size: 0.75em;

		&.active {
			opacity: 1;
		}
	}
</style>
