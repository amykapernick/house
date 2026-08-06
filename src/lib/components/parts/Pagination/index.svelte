<script lang="ts">
	import styles from './index.module.css';

	let {
		currentPage,
		totalPages,
		onPageChange,
	}: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	} = $props();
</script>

{#if totalPages > 1}
	<nav class={styles.pagination}>
		<button disabled={currentPage <= 1} onclick={() => onPageChange(currentPage - 1)}>Previous</button>
		<span>Page {currentPage} of {totalPages}</span>
		<button disabled={currentPage >= totalPages} onclick={() => onPageChange(currentPage + 1)}>Next</button>
	</nav>
{/if}
