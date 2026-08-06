<script lang="ts">
	import Pagination from "../Pagination/index.svelte";
	import styles from './index.module.css';

	let {
		id,
		columns,
		rows,
		filterLabel = 'Filter rows',
		pageSize = 10,
		class: className = ''
	}: {
		id: string;
		columns: { key: string; label: string }[];
		rows: Record<string, string>[];
		filterLabel?: string;
		pageSize?: number;
		class?: string;
	} = $props();

	let filter = $state('');
	let page = $state(1);

	let filteredRows = $derived(
		filter
			? rows.filter((row) => columns.some((col) => row[col.key]?.toLowerCase().includes(filter.toLowerCase())))
			: rows
	);
	let totalPages = $derived(Math.max(1, Math.ceil(filteredRows.length / pageSize)));
	let pageRows = $derived(filteredRows.slice((page - 1) * pageSize, page * pageSize));

	function handleFilter(value: string) {
		filter = value;
		page = 1;
	}
</script>

<div class="{styles['data-table']} {className}">
	<label for={id}>{filterLabel}</label>
	<input {id} type="search" placeholder={filterLabel} value={filter} oninput={(e) => handleFilter(e.currentTarget.value)} />

	<table>
		<thead>
			<tr>
				{#each columns as column (column.key)}
					<th>{column.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each pageRows as row, index (index)}
				<tr>
					{#each columns as column (column.key)}
						<td>{row[column.key]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<Pagination currentPage={page} {totalPages} onPageChange={(p) => (page = p)} />
</div>
